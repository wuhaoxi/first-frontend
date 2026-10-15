import { test, expect } from '@playwright/test';
import {
  DESKTOP,
  FEATURED_ID,
  setupMock,
  resetMock,
  goHome,
  waitForSection,
} from './mock-helpers';

const CAROUSEL = `${FEATURED_ID} [role="region"][aria-roledescription="carousel"]`;

test.describe('Homepage — Featured Destinations (homepage-featured-destinations.md)', () => {
  test.beforeEach(async ({ page }) => {
    await resetMock(page);
    await setupMock(page, { attractionsFail: false, postsFail: false });
    await goHome(page, { viewport: DESKTOP });
    await waitForSection(page, 'featured-destinations');
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN FD-1: 首屏展示精选目的地（rating 前 5）
   *   WHEN  用户访问首页 / 且景点接口返回数据
   *   THEN  Hero 区域按评分降序展示景点，含英文名、中文名、城市标签、
   *         评分徽标（1 位小数）与简介
   * ------------------------------------------------------------------ */
  test('WHEN/THEN FD-1: hero shows rating-ranked destinations with name, nameZh, city, rating badge and summary', async ({ page }) => {
    const carousel = page.locator(CAROUSEL);
    await expect(carousel).toBeVisible({ timeout: 15000 });

    // Section title + first slide = highest rating (Forbidden City, 4.9)
    await expect(page.locator(`${FEATURED_ID} h2`)).toHaveText('Featured Destinations');
    await expect(carousel.locator('h3')).toHaveText('Forbidden City');
    await expect(carousel.getByText('故宫')).toBeVisible();
    await expect(carousel.getByText('Beijing', { exact: true })).toBeVisible();
    await expect(carousel.getByText('4.9', { exact: true })).toBeVisible();
    await expect(carousel.getByText('Imperial palace at the heart of Beijing.')).toBeVisible();
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN FD-2: 无封面图时使用渐变占位色
   *   WHEN  某景点 coverImageUrl 为空
   *   THEN  该卡片显示渐变占位色背景，其余内容正常展示
   * ------------------------------------------------------------------ */
  test('WHEN/THEN FD-2: missing coverImage shows the gradient fallback background', async ({ page }) => {
    await expect(page.locator(CAROUSEL)).toBeVisible({ timeout: 15000 });

    const fallback = page.locator(`${FEATURED_ID} .bg-gradient-to-br`);
    await expect(fallback.first()).toBeVisible();
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN FD-3: 指示点与当前篇高亮
   *   WHEN  Hero 有多张精选
   *   THEN  每张对应一个指示点，当前篇指示点 aria-selected
   * ------------------------------------------------------------------ */
  test('WHEN/THEN FD-3: carousel renders one dot per slide with the active one marked', async ({ page }) => {
    const carousel = page.locator(CAROUSEL);
    await expect(carousel).toBeVisible({ timeout: 15000 });

    await expect(carousel.locator('[role="tab"]')).toHaveCount(5);
    await expect(carousel.locator('[role="tab"][aria-selected="true"]')).toHaveCount(1);
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN FD-4: 手动切换（箭头）
   *   WHEN  用户点击左右箭头
   *   THEN  立即切换到目标篇（自动轮播计时器重置）
   * ------------------------------------------------------------------ */
  test('WHEN/THEN FD-4: next/previous arrows switch slides', async ({ page }) => {
    const carousel = page.locator(CAROUSEL);
    await expect(carousel).toBeVisible({ timeout: 15000 });
    await carousel.hover(); // pause autoplay for deterministic assertions

    await expect(carousel.locator('h3')).toHaveText('Forbidden City');
    await page.locator(`${FEATURED_ID} button[aria-label="Next slide"]`).click();
    await expect(carousel.locator('h3')).toHaveText('Terracotta Army');
    await page.locator(`${FEATURED_ID} button[aria-label="Previous slide"]`).click();
    await expect(carousel.locator('h3')).toHaveText('Forbidden City');
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN FD-5: 点击卡片跳转景点详情
   *   WHEN  用户点击某张精选卡片
   *   THEN  页面跳转至 /attractions/{slug}
   * ------------------------------------------------------------------ */
  test('WHEN/THEN FD-5: clicking the slide navigates to /attractions/{slug}', async ({ page }) => {
    const carousel = page.locator(CAROUSEL);
    await expect(carousel).toBeVisible({ timeout: 15000 });
    await carousel.hover(); // pause autoplay so slide 1 stays active
    await page.locator(`${FEATURED_ID} [role="tab"][aria-label="Slide 1"]`).click();

    const link = page.locator(`${FEATURED_ID} a[href="/attractions/forbidden-city"]`);
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForURL('**/attractions/forbidden-city', { timeout: 10000 });
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN FD-6: 接口失败不阻塞页面
   *   WHEN  列表接口（sort=rating）返回错误
   *   THEN  Hero 区域显示错误占位与"重试"按钮
   *   AND   页面其余区块正常渲染
   * ------------------------------------------------------------------ */
  test('WHEN/THEN FD-6: list endpoint failure shows alert + Retry and other sections stay healthy', async ({ page }) => {
    await setupMock(page, { attractionsFail: true });
    await goHome(page, { viewport: DESKTOP });

    await expect(page.locator(`${FEATURED_ID} [role="alert"]`)).toBeVisible({ timeout: 15000 });
    await expect(page.locator(`${FEATURED_ID} button`).filter({ hasText: /Retry/i })).toBeVisible();

    // Other sections are not blocked
    await expect(page.locator('#search-entry')).toBeVisible();
    await waitForSection(page, 'hot-posts');
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN FD-7: 空数据整区块隐藏
   *   WHEN  列表接口返回空数组
   *   THEN  Hero 区块（含标题）不渲染，页面其余区块正常
   * ------------------------------------------------------------------ */
  test('WHEN/THEN FD-7: empty list hides the whole hero section (title included)', async ({ page }) => {
    await setupMock(page, { attractionsEmpty: true });
    await goHome(page, { viewport: DESKTOP });

    await waitForSection(page, 'hot-posts');
    await expect(page.locator(FEATURED_ID)).toHaveCount(0);
    await expect(page.getByText('Featured Destinations')).toHaveCount(0);
  });
});
