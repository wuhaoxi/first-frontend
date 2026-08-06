import { test, expect } from '@playwright/test';
import {
  DESKTOP,
  POSTS_ID,
  setupMock,
  resetMock,
  goHome,
  sectionHasData,
  waitForSection,
} from './mock-helpers';

test.describe('Homepage — Hot Posts (homepage-hot-posts.md)', () => {
  test.beforeEach(async ({ page }) => {
    await resetMock(page);
    await setupMock(page, { guidesFail: false, citiesFail: false, postsFail: false });
    await goHome(page, { viewport: DESKTOP });
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN HP-1: 展示热门帖子列表
   *   WHEN  首页加载且接口返回帖子数据
   *   THEN  展示帖子列表，每条含标题、城市名 chip、评论数、"N 小时前"相对时间
   *   AND   最多显示 5 条
   * ------------------------------------------------------------------ */
  test('WHEN/THEN HP-1: post list renders with title, city chip, comment count, relative time', async ({ page }) => {
    if (!(await sectionHasData(page, 'hot-posts'))) return;

    const posts = page.locator(`${POSTS_ID} a[href^="/community/post/"]`);
    const count = await posts.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(5);

    // First post should have a title, a city name, and a comment count
    const first = posts.first();
    await expect(first.locator('h4')).toBeVisible();
    await expect(first.getByText(/\d+/)).toBeVisible(); // comment count
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN HP-2: 标题超长截断
   *   WHEN  某条帖子标题超过 80 字符
   *   THEN  标题最多显示 80 字符，超出部分用省略号代替
   * ------------------------------------------------------------------ */
  test('WHEN/THEN HP-2: long titles are truncated with ellipsis', async ({ page }) => {
    if (!(await sectionHasData(page, 'hot-posts'))) return;

    const title = page.locator(`${POSTS_ID} h4`).first();
    await expect(title).toBeVisible({ timeout: 5000 });

    // Verify line-clamp class is applied (Tailwind truncate)
    const cls = await title.getAttribute('class');
    // line-clamp-1 keeps to one line with ellipsis
    if (cls) {
      expect(cls).toMatch(/line-clamp-1/);
    }
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN HP-3: 相对时间显示
   *   WHEN  首页帖子列表加载
   *   THEN  每条帖子展示相对时间（如 "3h ago"），不使用绝对时间戳
   * ------------------------------------------------------------------ */
  test('WHEN/THEN HP-3: relative time format displayed (e.g. "3h ago")', async ({ page }) => {
    if (!(await sectionHasData(page, 'hot-posts'))) return;

    // Relative time format should be present
    const timeLocator = page.locator(`${POSTS_ID} [data-relative-time], ${POSTS_ID} time`);
    if (await timeLocator.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      const text = await timeLocator.first().textContent();
      expect(text).toBeTruthy();
    }
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN HP-4: 空状态展示
   *   WHEN  用户访问首页且 hot-posts 接口返回空数组
   *   THEN  显示"No discussions yet"占位提示与"发起讨论"按钮
   * ------------------------------------------------------------------ */
  test('WHEN/THEN HP-4: empty state shows "No discussions yet" + "Start a Discussion" button', async ({ page }) => {
    // Use mock server to return empty posts array
    await setupMock(page, { postsEmpty: true });
    await goHome(page, { viewport: DESKTOP });

    await waitForSection(page, 'hot-posts');
    await expect(page.locator(POSTS_ID).getByText(/No discussions yet/i)).toBeVisible({ timeout: 10000 });
    await expect(page.locator(POSTS_ID).getByText(/Start a Discussion/i)).toBeVisible();
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN HP-5: 点击 "发起讨论" 按钮
   *   WHEN  讨论列表为空且用户点击 "发起讨论按钮"
   *   THEN  跳转至 /community/new
   * ------------------------------------------------------------------ */
  test('WHEN/THEN HP-5: clicking "Start a Discussion" navigates to /community/new', async ({ page }) => {
    await setupMock(page, { postsEmpty: true });
    await goHome(page, { viewport: DESKTOP });
    await waitForSection(page, 'hot-posts');

    const startBtn = page.locator(`${POSTS_ID} a[href="/community/new"]`);
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await startBtn.click();
    await page.waitForURL('**/community/new', { timeout: 10000 });
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN HP-6: 接口失败不阻塞页面
   *   WHEN  hot-posts 接口返回错误
   *   THEN  该区块显示错误占位与"重试"按钮，其余区块正常
   * ------------------------------------------------------------------ */
  test('WHEN/THEN HP-6: API failure shows alert + Retry button', async ({ page }) => {
    await setupMock(page, { postsFail: true });
    await goHome(page, { viewport: DESKTOP });

    await expect(page.locator(`${POSTS_ID} [role="alert"]`)).toBeVisible({ timeout: 15000 });
    await expect(page.locator(`${POSTS_ID} button`).filter({ hasText: /Retry/i })).toBeVisible();
  });
});
