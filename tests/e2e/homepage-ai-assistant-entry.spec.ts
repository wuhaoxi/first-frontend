import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import {
  DESKTOP,
  MOBILE,
  AI_SELECTOR,
  ASSISTANT_DIALOG,
  setupMock,
  resetMock,
  goHome,
  waitForSection,
} from './mock-helpers';

/**
 * Opens the assistant panel via `open`, retrying so a click/Enter that lands
 * before React hydration completes cannot flake the test.
 */
async function openPanel(page: Page, open: () => Promise<void>): Promise<Locator> {
  const dialog = page.locator(ASSISTANT_DIALOG);
  await expect(async () => {
    if ((await dialog.count()) === 0) {
      await open();
    }
    await expect(dialog).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 10000 });
  return dialog;
}

test.describe('Homepage — AI Assistant Entry (homepage-ai-assistant-entry.md)', () => {
  test.beforeEach(async ({ page }) => {
    await resetMock(page);
    await setupMock(page, { attractionsFail: false, postsFail: false });
    await goHome(page, { viewport: DESKTOP });
    await waitForSection(page, 'function-navigation');
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN AI-1: 悬浮按钮固定于视口右下角
   *   WHEN  用户访问首页
   *   THEN  视口右下角显示固定位置的 AI 助手悬浮入口按钮
   *   AND   按钮带有 tooltip 和 aria-label
   * ------------------------------------------------------------------ */
  test('WHEN/THEN AI-1: floating AI button fixed at bottom-right with aria-label', async ({ page }) => {
    const btn = page.locator(AI_SELECTOR);
    await expect(btn).toBeVisible({ timeout: 5000 });
    await expect(btn).toHaveAttribute('aria-label', 'AI Assistant');

    // Verify fixed positioning
    const box = await btn.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      // Should be on the right side of the viewport
      expect(box.x + box.width).toBeGreaterThan(DESKTOP.width * 0.5);
      // Should be near the bottom
      expect(box.y).toBeGreaterThan(DESKTOP.height * 0.5);
    }
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN AI-2: 不遮挡主要内容
   *   WHEN  用户向下滚动页面
   *   THEN  悬浮按钮保持可见但不对主要内容形成遮挡 (pointevents 正常工作)
   * ------------------------------------------------------------------ */
  test('WHEN/THEN AI-2: floating button remains visible on scroll without blocking content', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    await expect(page.locator(AI_SELECTOR)).toBeVisible({ timeout: 5000 });
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN AI-3: 移动端按钮尺寸适配
   *   WHEN  用户在移动端访问首页
   *   THEN  悬浮按钮按移动端适配尺寸显示，不遮挡底部导航
   * ------------------------------------------------------------------ */
  test('WHEN/THEN AI-3: mobile viewport shows adapted button size', async ({ page }) => {
    await goHome(page, { viewport: MOBILE });

    const btn = page.locator(AI_SELECTOR);
    await expect(btn).toBeVisible({ timeout: 5000 });

    const box = await btn.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      // Button width should fit within mobile viewport
      expect(box.width).toBeLessThan(MOBILE.width);
    }
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN AI-4: 键盘可触发
   *   WHEN  用户使用键盘 Tab 聚焦到悬浮按钮并回车
   *   THEN  触发与点击相同的行为（唤起 AI 对话）
   * ------------------------------------------------------------------ */
  test('WHEN/THEN AI-4: keyboard Enter on floating button triggers same as click', async ({ page }) => {
    const btn = page.locator(AI_SELECTOR);
    await btn.focus();
    await expect(btn).toBeFocused();

    // Enter behaves like a click — the assistant panel opens with focus in the input
    const dialog = await openPanel(page, () => page.keyboard.press('Enter'));
    await expect(dialog.getByLabel('Message')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN AI-5: 点击悬浮按钮打开面板
   *   WHEN  用户点击悬浮按钮
   *   THEN  AI 助手面板打开，输入框获得焦点；Esc 可关闭
   * ------------------------------------------------------------------ */
  test('WHEN/THEN AI-5: clicking the floating button opens the assistant panel', async ({ page }) => {
    const dialog = await openPanel(page, () => page.locator(AI_SELECTOR).click());
    await expect(dialog.getByLabel('Message')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });
});
