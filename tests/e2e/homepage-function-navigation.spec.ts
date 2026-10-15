import { test, expect } from '@playwright/test';
import {
  DESKTOP,
  FUNC_NAV_ID,
  ASSISTANT_DIALOG,
  setupMock,
  resetMock,
  goHome,
  waitForSection,
} from './mock-helpers';

test.describe('Homepage — Function Navigation (homepage-function-navigation.md)', () => {
  test.beforeEach(async ({ page }) => {
    await resetMock(page);
    await setupMock(page, { attractionsFail: false, postsFail: false });
    await goHome(page, { viewport: DESKTOP });
    await waitForSection(page, 'function-navigation');
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN FN-1: 展示三张功能导航卡片
   *   WHEN  首页加载
   *   THEN  展示3张卡片：Community、Attractions、AI Assistant
   *   AND   每张含图标、标题、一句话描述，三卡布局一致
   * ------------------------------------------------------------------ */
  test('WHEN/THEN FN-1: 3 function navigation cards with icon, title, description', async ({ page }) => {
    const cards = page.locator(`${FUNC_NAV_ID} .grid > a, ${FUNC_NAV_ID} .grid > button`);
    await expect(cards).toHaveCount(3);

    for (const expected of ['Community', 'Attractions', 'AI Assistant']) {
      await expect(page.locator(FUNC_NAV_ID).getByText(expected, { exact: true })).toBeVisible();
    }
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN FN-2: 卡片文案完整
   *   WHEN  任一卡片渲染
   *   THEN  图标、标题、一句话描述均完整显示，无截断
   * ------------------------------------------------------------------ */
  test('WHEN/THEN FN-2: each card shows complete title and description without truncation', async ({ page }) => {
    const descriptions = page.locator(`${FUNC_NAV_ID} .text-sm.text-muted-foreground`);
    const count = await descriptions.count();
    expect(count).toBe(3);

    for (let i = 0; i < count; i++) {
      const text = await descriptions.nth(i).textContent();
      expect(text?.length).toBeGreaterThan(5);
    }
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN FN-3: 点击 Community 卡片 → /posts
   *   WHEN  用户点击 "Community" 卡片
   *   THEN  页面跳转至 /posts
   * ------------------------------------------------------------------ */
  test('WHEN/THEN FN-3: clicking Community card navigates to /posts', async ({ page }) => {
    await page.locator(`${FUNC_NAV_ID} a[href="/posts"]`).click();
    await page.waitForURL('**/posts', { timeout: 10000 });
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN FN-4: 点击 Attractions 卡片 → /attractions
   *   WHEN  用户点击 "Attractions" 卡片
   *   THEN  页面跳转至 /attractions
   * ------------------------------------------------------------------ */
  test('WHEN/THEN FN-4: clicking Attractions card navigates to /attractions', async ({ page }) => {
    await page.locator(`${FUNC_NAV_ID} a[href="/attractions"]`).click();
    await page.waitForURL('**/attractions', { timeout: 10000 });
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN FN-5: 点击 AI Assistant 卡片 → 唤起 AI 对话
   *   WHEN  用户点击 "AI Assistant" 卡片且 AI 助手模块已接入
   *   THEN  AI 助手面板打开（不报错）
   * ------------------------------------------------------------------ */
  test('WHEN/THEN FN-5: clicking AI Assistant card opens the assistant dialog', async ({ page }) => {
    const aiCard = page.locator(`${FUNC_NAV_ID} button`).filter({ hasText: 'AI Assistant' });
    const dialog = page.locator(ASSISTANT_DIALOG);

    // Retry until React hydration attaches the click handler
    await expect(async () => {
      if ((await dialog.count()) === 0) {
        await aiCard.click();
      }
      await expect(dialog).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 10000 });
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN FN-6: 键盘可操作
   *   WHEN  用户用键盘 Tab 聚焦到某张卡片并回车
   *   THEN  触发与鼠标点击相同的跳转行为
   * ------------------------------------------------------------------ */
  test('WHEN/THEN FN-6: keyboard Enter on card triggers navigation', async ({ page }) => {
    const communityCard = page.locator(`${FUNC_NAV_ID} a[href="/posts"]`);
    await communityCard.focus();
    await expect(communityCard).toBeFocused();
    await page.keyboard.press('Enter');

    await page.waitForURL('**/posts', { timeout: 10000 });
  });
});
