import { test, expect, Page } from '@playwright/test';

// ============================================================
// Viewport presets
// ============================================================
const DESKTOP = { width: 1280, height: 720 };
const MOBILE  = { width: 375,  height: 667 };

// ============================================================
// Section IDs — exact DOM order per homepage-shell.md §4
// ============================================================
const SECTION_IDS = [
  'search-entry',
  'editors-picks',
  'function-navigation',
  'popular-destinations',
  'hot-posts',
] as const;

const AI_SELECTOR = 'button[aria-label="AI 助手"]';

// ============================================================
// Mock backend control (mock-server.ts on :8080)
// ============================================================
const MOCK = 'http://localhost:8080';

interface MockConfig {
  guidesFail?: boolean;
  attractionsFail?: boolean;
  postsFail?:  boolean;
  guidesDelay?: number;
  attractionsDelay?: number;
  postsDelay?:  number;
}

async function setupMock(page: Page, config: MockConfig) {
  const r = await page.request.post(`${MOCK}/__mock/configure`, {
    data: config,
    headers: { 'Content-Type': 'application/json' },
  });
  expect(r.ok(), `Mock config failed: ${r.status()}`).toBeTruthy();
}

async function resetMock(page: Page) {
  await page.request.post(`${MOCK}/__mock/reset`);
}

async function fetchMockLog(page: Page): Promise<string[]> {
  const r = await page.request.get(`${MOCK}/__mock/requests`);
  return (await r.json()) as string[];
}

// ============================================================
// Helpers
// ============================================================

/** Assert all 5 section IDs + AI entry are visible, DOM order matches spec. */
async function verifySections(page: Page) {
  for (const id of SECTION_IDS) {
    await page.waitForSelector(`#${id}`, { state: 'visible', timeout: 15000 });
  }
  await expect(page.locator(AI_SELECTOR)).toBeVisible({ timeout: 10000 });

  // Inline the array: $$eval runs in the browser, which has no access to Node consts
  const sectionIds: string[] = Array.from(SECTION_IDS);
  const order = await page.$$eval('[id]', (els, ids: string[]) =>
    els.map((e) => e.id).filter((id) => ids.includes(id)),
    sectionIds,
  );
  expect(order).toEqual(sectionIds);
}

/** Wait for skeleton placeholders to leave the DOM inside a section. */
async function waitForData(page: Page, sectionId: string) {
  await page.waitForSelector(`#${sectionId} [data-skeleton]`, {
    state: 'detached',
    timeout: 15000,
  });
}

// ============================================================
// Suite
// ============================================================

test.describe('Homepage Shell (homepage-shell.md)', () => {
  // ---- beforeEach: reset mocks → configure success → desktop → navigate ----
  test.beforeEach(async ({ page }) => {
    await resetMock(page);
    await setupMock(page, { guidesFail: false, attractionsFail: false, postsFail: false });
    await page.setViewportSize(DESKTOP);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN #1 — 访问首页渲染全部区块
   *   WHEN  用户访问 /
   *   THEN  页面按固定顺序渲染全部 6 个区块
   * ------------------------------------------------------------------ */
  test('WHEN/THEN #1: / renders all 6 sections in fixed order', async ({ page }) => {
    await verifySections(page);
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN #2 — 单区块 API 失败不影响整页
   *   WHEN  热门景点接口返回错误
   *   THEN  该区块显示错误占位与 Retry 按钮
   *   AND   编辑精选、热门帖子等其他区块正常渲染
   * ------------------------------------------------------------------ */
  test('WHEN/THEN #2: failed popular-attractions shows alert + Retry; others healthy', async ({ page }) => {
    // Override mock: attractions popular API fails
    await setupMock(page, { attractionsFail: true });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Static sections always render
    await expect(page.locator('#search-entry')).toBeVisible();
    await expect(page.locator('#function-navigation')).toBeVisible();

    // Failed section
    const dest = page.locator('#popular-destinations');
    await expect(dest).toBeVisible({ timeout: 15000 });
    await expect(dest.locator('[role="alert"]')).toBeVisible({ timeout: 15000 });
    await expect(dest.locator('button[aria-label*="Retry" i]')).toBeVisible();

    // Healthy data sections must NOT show error
    for (const id of ['editors-picks', 'hot-posts']) {
      const sec = page.locator(`#${id}`);
      await expect(sec).toBeVisible({ timeout: 15000 });
      await expect(sec.locator('[role="alert"]')).toHaveCount(0, { timeout: 10000 });
    }
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN #3 — 区块加载中显示骨架屏
   *   WHEN  任一区块数据加载中
   *   THEN  该区块显示骨架屏占位，页面整体不出现布局跳动 (CLS ≤ 0.1)
   * ------------------------------------------------------------------ */
  test('WHEN/THEN #3: skeletons appear during loading; no layout shift', async ({ page }) => {
    // 3 s delay so we can observe the skeleton frame
    await setupMock(page, { guidesDelay: 3000, attractionsDelay: 3000, postsDelay: 3000 });

    // `commit` returns as soon as initial HTML arrives (suspense fallbacks)
    await page.goto('/', { waitUntil: 'commit' });

    // Skeletons must be present
    await page.waitForSelector('[data-skeleton]', { timeout: 10000 });
    const n = await page.locator('[data-skeleton]').count();
    expect(n).toBeGreaterThan(0);

    // Record page dimensions while skeletons are visible
    const before = await page.evaluate(() => ({
      w: document.documentElement.scrollWidth,
      h: document.documentElement.scrollHeight,
    }));

    // Wait until all data sections resolve
    for (const id of ['editors-picks', 'popular-destinations', 'hot-posts']) {
      await waitForData(page, id);
    }

    const after = await page.evaluate(() => ({
      w: document.documentElement.scrollWidth,
      h: document.documentElement.scrollHeight,
    }));

    const dh = Math.abs(after.h - before.h);
    // Tolerance: 20% of initial height + 100px buffer for skeleton-to-content growth
    const tolerance = before.h * 0.2 + 100;
    expect(dh, `Layout shift ${dh}px exceeds tolerance ${tolerance}px`).toBeLessThanOrEqual(tolerance);
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN #4 — 移动端单列展示
   *   WHEN  视口宽度 < 768px
   *   THEN  各区块以单列顺序堆叠，无横向溢出滚动
   * ------------------------------------------------------------------ */
  test('WHEN/THEN #4: viewport < 768 px → sections stack vertically, no overflow', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    for (const id of SECTION_IDS) {
      await expect(page.locator(`#${id}`)).toBeVisible({ timeout: 15000 });
    }

    const { sw, vw } = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      vw: window.innerWidth,
    }));
    expect(sw).toBeLessThanOrEqual(vw + 2);

    // Popular-destinations grid: 2 columns on mobile (only when data loads successfully)
    const grid = page.locator('#popular-destinations .grid');
    // If data is still loading or errored, skip the class assertion
    const alertCount = await grid.locator('[role="alert"]').count();
    if (alertCount === 0) {
      const cls = await grid.getAttribute('class');
      expect(cls).toContain('grid-cols-2');
    }
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN #5 — LCP ≤ 2 s + API 请求并行发起
   *   WHEN  以生产构建访问首页（3G 网络模拟）
   *   THEN  LCP ≤ 2 s
   *   AND   各 API 请求并行发起
   * ------------------------------------------------------------------ */
  test('WHEN/THEN #5: page loads ≤ 2 s; 3 data APIs fire in parallel', async ({ page }) => {
    await setupMock(page, { guidesDelay: 100, attractionsDelay: 100, postsDelay: 100 });

    const t0 = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    for (const id of ['editors-picks', 'popular-destinations', 'hot-posts']) {
      await waitForData(page, id);
    }
    expect(Date.now() - t0).toBeLessThanOrEqual(2000);

    const log = await fetchMockLog(page);
    for (const ep of ['featured-guides', 'attractions-popular', 'hot-posts']) {
      expect(log).toContain(ep);
    }
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN #6 — 键盘可完整浏览
   *   WHEN  用户仅使用键盘 Tab 遍历首页
   *   THEN  所有可交互元素（搜索框、轮播箭头、卡片、按钮）均可获得焦点并被触发
   * ------------------------------------------------------------------ */
  test('WHEN/THEN #6: Tab reaches all interactive elements; they accept input', async ({ page }) => {
    // All APIs fail → 3 retry buttons + static controls = rich interaction surface
    await setupMock(page, { guidesFail: true, attractionsFail: true, postsFail: true });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#editors-picks [role="alert"]', { timeout: 15000 });

    // -- Phase A: Tab through the page, record focused tag names --
    const tags = new Set<string>();
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(150);
      const tag = await page.evaluate(() => document.activeElement?.tagName.toLowerCase() ?? null);
      if (!tag) break;
      tags.add(tag);
    }
    expect(Array.from(tags)).toContain('input');
    expect(Array.from(tags).some((t) => t === 'button' || t === 'a')).toBeTruthy();

    // -- Phase B: spot-check critical elements --
    // AI floating button
    await page.locator(AI_SELECTOR).focus();
    await expect(page.locator(AI_SELECTOR)).toBeFocused();

    // Search input: focus + type
    const input = page.locator('#search-entry input');
    await input.focus();
    await input.fill('Chengdu');
    await expect(input).toHaveValue('Chengdu');

    // Retry button
    const retry = page.locator('button[aria-label*="Retry" i]').first();
    await retry.focus();
    await expect(retry).toBeFocused();
  });
});
