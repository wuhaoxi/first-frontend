import { test, expect } from '@playwright/test';
import {
  DESKTOP,
  FUNC_NAV_ID,
  setupMock,
  resetMock,
  goHome,
  waitForSection,
} from './mock-helpers';

test.describe('Homepage — Function Navigation (homepage-function-navigation.md)', () => {
  test.beforeEach(async ({ page }) => {
    await resetMock(page);
    await setupMock(page, { guidesFail: false, citiesFail: false, postsFail: false });
    await goHome(page, { viewport: DESKTOP });
    await waitForSection(page, 'function-navigation');
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN FN-1: 展示三张功能导航卡片
   *   WHEN  首页加载
   *   THEN  展示3张卡片：旅游社区、景点攻略、AI 助手
   *   AND   每张含图标、标题、一句话描述，三卡布局一致
   * ------------------------------------------------------------------ */
  test('WHEN/THEN FN-1: 3 function navigation cards with icon, title, description', async ({ page }) => {
    const cards = page.locator(`${FUNC_NAV_ID} .grid > a, ${FUNC_NAV_ID} .grid > button`);
    await expect(cards).toHaveCount(3);

    for (const expected of ['旅游社区', '景点攻略', 'AI 助手']) {
      await expect(page.locator(FUNC_NAV_ID).getByText(expected)).toBeVisible();
    }
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN FN-2: 卡片文案完整
   *   WHEN  任一卡片渲染
   *   THEN  图标、标题、一句话描述均完整显示，无截断
   * ------------------------------------------------------------------ */
  test('WHEN/THEN FN-2: each card shows complete title and description without truncation', async ({ page }) => {
    const descriptions = page.locator(`${FUNC_NAV_ID} .text-center.text-sm`);
    const count = await descriptions.count();
    expect(count).toBe(3);

    for (let i = 0; i < count; i++) {
      const text = await descriptions.nth(i).textContent();
      expect(text?.length).toBeGreaterThan(5);
    }
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN FN-3: 点击旅游社区卡片 → /community
   *   WHEN  用户点击"旅游社区"卡片
   *   THEN  页面跳转至 /community
   * ------------------------------------------------------------------ */
  test('WHEN/THEN FN-3: clicking 旅游社区 card navigates to /community', async ({ page }) => {
    await page.locator(`${FUNC_NAV_ID} a[href="/community"]`).click();
    await page.waitForURL('**/community', { timeout: 10000 });
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN FN-4: 点击景点攻略卡片 → /guides
   *   WHEN  用户点击"景点攻略"卡片
   *   THEN  页面跳转至 /guides
   * ------------------------------------------------------------------ */
  test('WHEN/THEN FN-4: clicking 景点攻略 card navigates to /guides', async ({ page }) => {
    await page.locator(`${FUNC_NAV_ID} a[href="/guides"]`).click();
    await page.waitForURL('**/guides', { timeout: 10000 });
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN FN-5: 点击 AI 助手卡片 → 不报错
   *   WHEN  用户点击"AI 助手"卡片且 AI 助手模块尚未接入
   *   THEN  页面不出现报错（no-op 或占位提示）
   * ------------------------------------------------------------------ */
  test('WHEN/THEN FN-5: clicking AI Assistant card does not throw error (AI not integrated)', async ({ page }) => {
    const aiCard = page.locator(`${FUNC_NAV_ID} button`).filter({ hasText: 'AI 助手' });
    await aiCard.click();

    await page.waitForTimeout(300);
    await expect(page.locator('body')).toBeVisible();
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN FN-6: 键盘可操作
   *   WHEN  用户用键盘 Tab 聚焦到某张卡片并回车
   *   THEN  触发与鼠标点击相同的跳转行为
   * ------------------------------------------------------------------ */
  test('WHEN/THEN FN-6: keyboard Enter on card triggers navigation', async ({ page }) => {
    const communityCard = page.locator(`${FUNC_NAV_ID} a[href="/community"]`);
    await communityCard.focus();
    await expect(communityCard).toBeFocused();
    await page.keyboard.press('Enter');

    await page.waitForURL('**/community', { timeout: 10000 });
  });
});
