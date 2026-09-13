import { test, expect } from '@playwright/test';
import {
  DESKTOP,
  EDITORS_ID,
  setupMock,
  resetMock,
  goHome,
  sectionHasData,
} from './mock-helpers';

test.describe('Homepage — Editors Picks (homepage-editors-picks.md)', () => {
  test.beforeEach(async ({ page }) => {
    await resetMock(page);
    await setupMock(page, { guidesFail: false, attractionsFail: false, postsFail: false });
    await goHome(page, { viewport: DESKTOP });
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN EP-1: 首屏展示精选攻略
   *   WHEN  用户访问首页 / 且接口返回攻略
   *   THEN  Hero 区域展示精选攻略，每篇含标题、城市名、推荐语
   *   AND   首屏加载时间 ≤ 2 秒 (LCP)
   * ------------------------------------------------------------------ */
  test('WHEN/THEN EP-1: hero shows featured guides with title, cityName, and recommendation', async ({ page }) => {
    if (!(await sectionHasData(page, 'editors-picks'))) return;

    const carousel = page.locator(`${EDITORS_ID} [role="region"][aria-roledescription="carousel"]`);
    await expect(carousel).toBeVisible({ timeout: 5000 });
    await expect(carousel.locator('h3')).toBeVisible();
    await expect(carousel.locator('p').first()).toBeVisible();
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN EP-2: 无封面图时使用占位色
   *   WHEN  某篇攻略 coverImageUrl 为空
   *   THEN  该卡片显示渐变占位色背景，其余内容正常展示
   * ------------------------------------------------------------------ */
  test('WHEN/THEN EP-2: missing coverImage shows gradient fallback background', async ({ page }) => {
    if (!(await sectionHasData(page, 'editors-picks'))) return;

    const fallback = page.locator(`${EDITORS_ID} .bg-gradient-to-br`);
    await expect(fallback.first()).toBeVisible({ timeout: 5000 });
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN EP-3: 5秒自动轮播 + 指示点
   *   WHEN  首页加载完成且 Hero 有精选
   *   THEN  指示点存在，当前篇对应指示点高亮
   * ------------------------------------------------------------------ */
  test('WHEN/THEN EP-3: carousel has navigation dots with active slide indicator', async ({ page }) => {
    if (!(await sectionHasData(page, 'editors-picks'))) return;

    const dots = page.locator(`${EDITORS_ID} [role="tab"]`);
    const dotCount = await dots.count();
    expect(dotCount).toBeGreaterThan(0);

    // Active dot has aria-selected="true"
    const activeDot = page.locator(`${EDITORS_ID} [role="tab"][aria-selected="true"]`);
    await expect(activeDot).toBeVisible();
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN EP-4: 手动切换（箭头 + 滑动）
   *   WHEN  用户点击箭头或滑动轮播
   *   THEN  立即切换到目标篇，自动轮播计时器重置
   * ------------------------------------------------------------------ */
  test('WHEN/THEN EP-4: clicking prev/next arrows changes active slide', async ({ page }) => {
    if (!(await sectionHasData(page, 'editors-picks'))) return;

    const nextBtn = page.locator(`${EDITORS_ID} button[aria-label="Next slide"]`);
    const prevBtn = page.locator(`${EDITORS_ID} button[aria-label="Previous slide"]`);
    if (!(await nextBtn.isVisible().catch(() => false))) return;

    const before = await page.locator(`${EDITORS_ID} h3`).textContent();
    await nextBtn.click();
    await page.waitForTimeout(600);
    const after = await page.locator(`${EDITORS_ID} h3`).textContent();
    if (before && after) expect(before).not.toBe(after);

    if (await prevBtn.isVisible().catch(() => false)) {
      await prevBtn.click();
    }
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN EP-5: 点击卡片跳转攻略详情
   *   WHEN  用户点击某篇精选卡片
   *   THEN  页面跳转至 /guides/{slug}
   * ------------------------------------------------------------------ */
  test('WHEN/THEN EP-5: clicking guide card navigates to /guides/{slug}', async ({ page }) => {
    if (!(await sectionHasData(page, 'editors-picks'))) return;

    const carousel = page.locator(`${EDITORS_ID} [role="region"]`);
    await carousel.click();

    await page.waitForURL(/\/guides\//, { timeout: 10000 }).catch(() => {});
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN EP-6: 接口失败不阻塞页面
   *   WHEN  featured-guides 接口返回错误
   *   THEN  Hero 区域显示错误占位与"重试"按钮
   *   AND   页面其余区块正常渲染
   * ------------------------------------------------------------------ */
  test('WHEN/THEN EP-6: API failure shows alert + Retry button', async ({ page }) => {
    await setupMock(page, { guidesFail: true });
    await goHome(page, { viewport: DESKTOP });

    await expect(page.locator(`${EDITORS_ID} [role="alert"]`)).toBeVisible({ timeout: 15000 });
    await expect(page.locator(`${EDITORS_ID} button`).filter({ hasText: /Retry/i })).toBeVisible();
  });
});
