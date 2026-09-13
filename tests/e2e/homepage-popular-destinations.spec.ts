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
    await setupMock(page, { guidesFail: false, attractionsFail: false, postsFail: false });
    await goHome(page, { viewport: DESKTOP });
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN PD-1: 展示景点卡片网格
   *   WHEN  首页加载且接口返回热门景点数据
   *   THEN  展示景点卡片（含景点名与城市标签），最多 6 个
   * ------------------------------------------------------------------ */
  test('WHEN/THEN PD-1: attraction cards rendered with name and city label', async ({ page }) => {
    if (!(await sectionHasData(page, 'popular-destinations'))) return;

    for (const name of ['Forbidden City', 'Terracotta Army']) {
      await expect(page.locator(DEST_ID).getByText(name)).toBeVisible({ timeout: 5000 });
    }
    // City labels on the cards
    await expect(page.locator(DEST_ID).getByText('Beijing')).toBeVisible();
    await expect(page.locator(DEST_ID).getByText('Hangzhou')).toBeVisible();

    const cards = page.locator(`${DEST_ID} .grid > a`);
    expect(await cards.count()).toBe(6);
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN PD-2: 卡片字段完整
   *   WHEN  任一景点卡片渲染
   *   THEN  包含封面图（或占位块）、景点名、中文名、城市标签
   * ------------------------------------------------------------------ */
  test('WHEN/THEN PD-2: each card has name heading, Chinese name and city label', async ({ page }) => {
    if (!(await sectionHasData(page, 'popular-destinations'))) return;

    const cards = page.locator(`${DEST_ID} .grid > a`);
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(6);

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      await expect(card.locator('h3')).toBeVisible();
      // Chinese name + city label paragraphs
      await expect(card.locator('p')).toHaveCount(2);
    }

    // Placeholder block (mock covers are all null → first letter shown)
    const placeholder = page.locator(`${DEST_ID} .text-2xl`).first();
    await expect(placeholder).toBeVisible();
    await expect(placeholder).toHaveText('F');
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN PD-3: 点击卡片跳转景点详情
   *   WHEN  用户点击任一景点卡片
   *   THEN  页面跳转至 /attractions/{slug}
   * ------------------------------------------------------------------ */
  test('WHEN/THEN PD-3: clicking a card navigates to /attractions/{slug}', async ({ page }) => {
    if (!(await sectionHasData(page, 'popular-destinations'))) return;

    const link = page.locator(`${DEST_ID} a[href="/attractions/forbidden-city"]`).first();
    await expect(link).toBeVisible({ timeout: 5000 });
    await link.click();
    await page.waitForURL('**/attractions/forbidden-city', { timeout: 10000 });
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN PD-4: 所有卡片均可点击，无降级分支
   *   WHEN  热门景点数据渲染完成
   *   THEN  网格内所有卡片均为链接（无不可点击卡片）
   *   AND   不出现 "Coming soon" 文案
   * ------------------------------------------------------------------ */
  test('WHEN/THEN PD-4: every grid child is an anchor; no "Coming soon" text anywhere', async ({ page }) => {
    if (!(await sectionHasData(page, 'popular-destinations'))) return;

    const children = page.locator(`${DEST_ID} .grid > *`);
    const count = await children.count();
    expect(count).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < count; i++) {
      const tag = await children.nth(i).evaluate((el) => el.tagName.toLowerCase());
      expect(tag).toBe('a');
    }

    await expect(page.locator(DEST_ID).getByText('Coming soon')).toHaveCount(0);
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN PD-5: 接口失败不阻塞页面
   *   WHEN  热门景点接口返回错误
   *   THEN  该区块显示错误占位与"重试"按钮，其余区块正常
   * ------------------------------------------------------------------ */
  test('WHEN/THEN PD-5: API failure shows alert + Retry button', async ({ page }) => {
    await setupMock(page, { attractionsFail: true });
    await goHome(page, { viewport: DESKTOP });

    await expect(page.locator(`${DEST_ID} [role="alert"]`)).toBeVisible({ timeout: 15000 });
    await expect(page.locator(`${DEST_ID} button`).filter({ hasText: /Retry/i })).toBeVisible();
  });
});
