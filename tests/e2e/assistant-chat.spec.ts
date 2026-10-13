import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import {
  DESKTOP,
  AI_SELECTOR,
  ASSISTANT_DIALOG,
  goHome,
  waitForSection,
  loginAsMockUser,
  sendAssistantMessage,
} from './mock-helpers';

/**
 * Opens the assistant panel from a trigger. The click is retried so the test
 * stays stable if the first click lands before React hydration completes.
 */
async function openAssistant(page: Page, trigger?: Locator): Promise<Locator> {
  const dialog = page.locator(ASSISTANT_DIALOG);
  await expect(async () => {
    if ((await dialog.count()) === 0) {
      await (trigger ?? page.locator(AI_SELECTOR)).click();
    }
    await expect(dialog).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 10000 });
  return dialog;
}

test.describe('Homepage — AI Assistant chat (add-ai-assistant)', () => {
  test.beforeEach(async ({ page }) => {
    // Chat assertions do not depend on the mock's homepage data, so no mock
    // configuration here — this also avoids resetting shared mock state that
    // parallel specs rely on.
    await goHome(page, { viewport: DESKTOP });
    await waitForSection(page, 'function-navigation');
  });

  /* Scenario: 从悬浮按钮打开 + 逐段追加 + 关闭方式 */
  test('从悬浮按钮打开: send streams the reply, Escape closes', async ({ page }) => {
    await loginAsMockUser(page);
    const dialog = await openAssistant(page);
    await expect(dialog.getByLabel('Message')).toBeFocused();

    await sendAssistantMessage(page, 'hello there');

    await expect(dialog.getByText('hello there', { exact: true })).toBeVisible();
    await expect(dialog).toContainText('Echo: hello there — mock reply', { timeout: 10000 });

    await page.keyboard.press('Escape');
    await expect(page.locator(ASSISTANT_DIALOG)).toHaveCount(0);
  });

  /* Scenario: 从功能导航卡片打开 */
  test('从功能导航卡片打开: the AI card opens the panel and streams', async ({ page }) => {
    await loginAsMockUser(page);
    const navCard = page
      .locator('#function-navigation')
      .getByRole('button', { name: /plan your trip/i });
    const dialog = await openAssistant(page, navCard);

    await sendAssistantMessage(page, 'trip to Chengdu');
    await expect(dialog).toContainText('Echo: trip to Chengdu — mock reply', { timeout: 10000 });
  });

  /* 未认证时后端返回 401 → 面板提示登录（auth model of /api/assistant/chat） */
  test('未认证: unauthenticated send shows the login prompt', async ({ page }) => {
    const dialog = await openAssistant(page);

    await sendAssistantMessage(page, 'hello there');

    const link = dialog.getByRole('link', { name: /log in/i });
    await expect(link).toBeVisible({ timeout: 5000 });
    await expect(link).toHaveAttribute('href', '/login');
    await expect(dialog.getByLabel('Message')).toBeDisabled();
  });

  /* 服务端错误 → 错误横幅 + Try again 重发 */
  test('服务端错误: the banner shows and Try again re-sends the turn', async ({ page }) => {
    await loginAsMockUser(page);
    const dialog = await openAssistant(page);

    // Page-scoped request log — the mock's shared request log is reset
    // concurrently by parallel specs.
    const chatPosts: string[] = [];
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/api/assistant/chat')) {
        chatPosts.push(req.url());
      }
    });

    await sendAssistantMessage(page, 'please fail');

    const alert = dialog.getByRole('alert');
    await expect(alert).toContainText('temporarily unavailable', { timeout: 5000 });
    expect(chatPosts).toHaveLength(1);

    await dialog.getByRole('button', { name: 'Try again' }).click();
    await expect.poll(() => chatPosts.length, { timeout: 5000 }).toBe(2);
    await expect(alert).toContainText('temporarily unavailable');
  });

  /* 限流 429 → 横幅显示服务端消息 */
  test('限流 429: the banner shows the rate-limit message', async ({ page }) => {
    await loginAsMockUser(page);
    const dialog = await openAssistant(page);

    await sendAssistantMessage(page, 'limit please');
    await expect(dialog.getByRole('alert')).toContainText('Too many', { timeout: 5000 });
  });

  /* 知识库引用：纯文本 Sources 尾注渲染在回复气泡内，气泡内无任何链接元素 */
  test('知识库引用: the plain-text Sources tail renders inside the bubble without links', async ({ page }) => {
    await loginAsMockUser(page);
    const dialog = await openAssistant(page);

    await sendAssistantMessage(page, 'knowledge: 杭州西湖是哪里？');

    const bubble = dialog.locator('div[aria-live="polite"]');
    await expect(bubble).toHaveCount(1);
    await expect(bubble).toContainText('Sources: [1] 《杭州西湖》 (attractions)', { timeout: 10000 });
    await expect(bubble.locator('a')).toHaveCount(0);
  });
});
