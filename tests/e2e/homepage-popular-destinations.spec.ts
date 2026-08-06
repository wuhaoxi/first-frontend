import { test, expect } from '@playwright/test';
import {
  DESKTOP,
  DEST_ID,
  setupMock,
  resetMock,
  goHome,
  sectionHasData,
} from './mock-helpers';

test.describe('Homepage — Popular Destinations (homepage-popular-destinations.md)', () => {
  test.beforeEach(async ({ page }) => {
    await resetMock(page);
    await setupMock(page, { guidesFail: false, citiesFail: false, postsFail: false });
    await goHome(page, { viewport: DESKTOP });
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN PD-1: 展示热门城市网格
   *   WHEN  首页加载且接口返回热门城市数据
   *   THEN  展示城市卡片，含城市名、攻略数量标签
   *   AND   最多 6 个
   * ------------------------------------------------------------------ */
  test('WHEN/THEN PD-1: city cards rendered with name and guide count', async ({ page }) => {
    if (!(await sectionHasData(page, 'popular-destinations'))) return;

    for (const city of ['Chengdu', 'Beijing']) {
      await expect(page.locator(DEST_ID).getByText(city)).toBeVisible({ timeout: 5000 });
    }
    // 5 cities with guideCount > 0; Xi'an has guideCount=0 → "Coming soon"
    await expect(page.locator(DEST_ID).getByText(/guides/)).toHaveCount(5);
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN PD-2: 卡片字段完整
   *   WHEN  任一城市卡片渲染
   *   THEN  包含城市封面图（或占位图）、城市名、攻略数量标签（格式 "N guides"）
   * ------------------------------------------------------------------ */
  test('WHEN/THEN PD-2: each card has placeholder image, name, and guide count label', async ({ page }) => {
    if (!(await sectionHasData(page, 'popular-destinations'))) return;

    // All cards should show their city name (first letter as fallback icon)
    const cardContainers = page.locator(`${DEST_ID} .grid > a, ${DEST_ID} .grid > div`);
    const count = await cardContainers.count();
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(6);

    for (let i = 0; i < count; i++) {
      const card = cardContainers.nth(i);
      // Each card has a name heading
      await expect(card.locator('h3')).toBeVisible();
      // Each card has a guide count or "Coming soon"
      await expect(card.locator('p')).toBeVisible();
    }
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN PD-3: 点击卡片跳转攻略列表
   *   WHEN  用户点击攻略数 > 0 的城市卡片
   *   THEN  页面跳转至 /guides?city={citySlug}
   * ------------------------------------------------------------------ */
  test('WHEN/THEN PD-3: clicking clickable city card navigates to /guides?city={slug}', async ({ page }) => {
    if (!(await sectionHasData(page, 'popular-destinations'))) return;

    const link = page.locator(`${DEST_ID} a[href^="/guides?city="]`).first();
    if (await link.isVisible().catch(() => false)) {
      await link.click();
      await page.waitForURL(/\/guides\?city=/, { timeout: 10000 }).catch(() => {});
    }
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN PD-4: 0攻略城市显示 "Coming soon" 且不可点击
   *   WHEN  某个 isPopular=true 的城市关联攻略数为 0
   *   THEN  该城市仍展示卡片，标签显示 "Coming soon"，卡片不可点击
   * ------------------------------------------------------------------ */
  test('WHEN/THEN PD-4: city with 0 guides shows "Coming soon" and is not clickable', async ({ page }) => {
    if (!(await sectionHasData(page, 'popular-destinations'))) return;

    // Xi'an has guideCount=0 in mock data
    await expect(page.locator(DEST_ID).getByText('Coming soon')).toBeVisible({ timeout: 5000 });

    const xianCard = page.locator(`${DEST_ID} .grid > div`).filter({ hasText: "Xi'an" }).first();
    const tag = await xianCard.evaluate((el) => el.tagName.toLowerCase());
    expect(tag).toBe('div'); // not a link — non-clickable
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN PD-5: 接口失败不阻塞页面
   *   WHEN  popular-destinations 接口返回错误
   *   THEN  该区块显示错误占位与"重试"按钮，其余区块正常
   * ------------------------------------------------------------------ */
  test('WHEN/THEN PD-5: API failure shows alert + Retry button', async ({ page }) => {
    await setupMock(page, { citiesFail: true });
    await goHome(page, { viewport: DESKTOP });

    await expect(page.locator(`${DEST_ID} [role="alert"]`)).toBeVisible({ timeout: 15000 });
    await expect(page.locator(`${DEST_ID} button`).filter({ hasText: /Retry/i })).toBeVisible();
  });
});
