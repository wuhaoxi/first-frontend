import { expect, Page } from '@playwright/test';

// ============================================================
// Viewport presets
// ============================================================
export const DESKTOP = { width: 1280, height: 720 } as const;
export const MOBILE = { width: 375, height: 667 } as const;

// ============================================================
// Section IDs
// ============================================================
export const SEARCH_ID = '#search-entry';
export const FEATURED_ID = '#featured-destinations';
export const FUNC_NAV_ID = '#function-navigation';
export const DEST_ID = '#popular-destinations';
export const POSTS_ID = '#hot-posts';
export const AI_SELECTOR = 'button[aria-label="AI Assistant"]';
export const ASSISTANT_DIALOG = '[role="dialog"][aria-label="AI Assistant"]';

// ============================================================
// Mock server control (mock-server.ts on :8080)
// ============================================================
const MOCK = 'http://localhost:8080';

export interface MockConfig {
  attractionsFail?: boolean;
  postsFail?: boolean;
  attractionsDelay?: number;
  postsDelay?: number;
  postsEmpty?: boolean;
  attractionsEmpty?: boolean;
}

export async function setupMock(page: Page, config: MockConfig) {
  const r = await page.request.post(`${MOCK}/__mock/configure`, {
    data: config,
    headers: { 'Content-Type': 'application/json' },
  });
  expect(r.ok(), `Mock config failed: ${r.status()}`).toBeTruthy();
}

export async function resetMock(page: Page) {
  await page.request.post(`${MOCK}/__mock/reset`);
}

export async function fetchMockLog(page: Page): Promise<string[]> {
  const r = await page.request.get(`${MOCK}/__mock/requests`);
  return (await r.json()) as string[];
}

// ============================================================
// Assistant helpers
// ============================================================
export async function loginAsMockUser(page: Page) {
  // The backend authorizes the assistant via the httpOnly `access_token`
  // cookie; the mock accepts its presence (see mock-server.ts).
  await page.context().addCookies([
    { name: 'access_token', value: 'mock-access-token', domain: 'localhost', path: '/' },
  ]);
}

export async function sendAssistantMessage(page: Page, text: string) {
  const dialog = page.locator(ASSISTANT_DIALOG);
  await dialog.getByLabel('Message').fill(text);
  await dialog.getByRole('button', { name: 'Send' }).click();
}

// ============================================================
// Navigation helpers
// ============================================================
export async function goHome(
  page: Page,
  opts?: { viewport?: typeof DESKTOP | typeof MOBILE },
) {
  if (opts?.viewport) await page.setViewportSize(opts.viewport);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
}

export async function waitForSection(page: Page, sectionId: string) {
  await page.waitForSelector(`#${sectionId}`, { state: 'visible', timeout: 15000 });
}

// ============================================================
// Data-ready guard — returns true if section has data (not errored)
// ============================================================
export async function sectionHasData(page: Page, sectionId: string): Promise<boolean> {
  const alert = page.locator(`#${sectionId} [role="alert"]`);
  await alert.waitFor({ state: 'attached', timeout: 15000 }).catch(() => {});
  return (await alert.count()) === 0;
}
