import { test, expect } from '@playwright/test';
import {
  DESKTOP,
  SEARCH_ID,
  setupMock,
  resetMock,
  goHome,
  waitForSection,
} from './mock-helpers';

test.describe('Homepage — Search Entry (homepage-search-entry.md)', () => {
  test.beforeEach(async ({ page }) => {
    await resetMock(page);
    await setupMock(page, { guidesFail: false, citiesFail: false, postsFail: false });
    await goHome(page, { viewport: DESKTOP });
    await waitForSection(page, 'search-entry');
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN SE-1: 首页加载 → 搜索栏展示
   *   WHEN  首页加载
   *   THEN  页面顶部显示搜索输入框与搜索按钮
   *   AND   输入框有 placeholder 与关联的 label
   * ------------------------------------------------------------------ */
  test('WHEN/THEN SE-1: search bar renders with input, button, placeholder, and label', async ({ page }) => {
    const input = page.locator('#homepage-search');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', /Search/);
    await expect(input).toHaveAttribute('aria-label', 'Search destinations');

    const button = page.locator(`${SEARCH_ID} button[aria-label="Search"]`);
    await expect(button).toBeVisible();
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN SE-2: 输入 "Chengdu" 并回车 → 跳转 /guides?q=Chengdu
   *   WHEN  用户在首页搜索栏输入 "Chengdu" 并回车
   *   THEN  页面跳转至 /guides?q=Chengdu
   * ------------------------------------------------------------------ */
  test('WHEN/THEN SE-2: typing "Chengdu" and Enter navigates to /guides?q=Chengdu', async ({ page }) => {
    await page.locator('#homepage-search').click();
    await page.keyboard.type('Chengdu', { delay: 10 });
    await page.keyboard.press('Enter');

    await page.waitForURL('**/guides?q=Chengdu', { timeout: 10000 });
    expect(page.url()).toContain('/guides?q=Chengdu');
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN SE-3: 特殊字符 URL 编码
   *   WHEN  用户输入含空格/中文的关键词（如 "成都 攻略"）
   *   THEN  跳转 URL 的 q 参数按 URL 编码规则正确转义
   * ------------------------------------------------------------------ */
  test('WHEN/THEN SE-3: special characters are URL-encoded in query param', async ({ page }) => {
    await page.locator('#homepage-search').click();
    await page.keyboard.type('成都 攻略', { delay: 10 });
    await page.keyboard.press('Enter');

    await page.waitForURL(/\/guides\?q=/, { timeout: 10000 });
    // Chinese chars "成都" encoded as UTF-8 percent-encoding
    expect(page.url()).toContain('%E6%88%90%E9%83%BD');
    // Raw Chinese should not appear in the URL
    expect(page.url()).not.toContain('成都');
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN SE-4: 点击搜索按钮触发
   *   WHEN  用户输入关键词后点击搜索按钮
   *   THEN  行为与回车一致，跳转至 /guides?q={keyword}
   * ------------------------------------------------------------------ */
  test('WHEN/THEN SE-4: clicking search button navigates same as Enter', async ({ page }) => {
    await page.locator('#homepage-search').click();
    await page.keyboard.type('Beijing', { delay: 10 });
    await page.locator(`${SEARCH_ID} button[aria-label="Search"]`).click();

    await page.waitForURL('**/guides?q=Beijing', { timeout: 10000 });
    expect(page.url()).toContain('/guides?q=Beijing');
  });

  /* ------------------------------------------------------------------
   * WHEN/THEN SE-5: 空输入不跳转
   *   WHEN  用户输入为空或仅含空格并回车
   *   THEN  页面不发生跳转，输入框获得焦点
   * ------------------------------------------------------------------ */
  test('WHEN/THEN SE-5: empty or whitespace input does not navigate', async ({ page }) => {
    const currentUrl = page.url();

    await page.locator('#homepage-search').click();
    await page.keyboard.type('   ', { delay: 10 });
    await page.keyboard.press('Enter');

    await page.waitForTimeout(500);
    expect(page.url()).toBe(currentUrl);
    await expect(page.locator('#homepage-search')).toBeFocused();
  });
});
