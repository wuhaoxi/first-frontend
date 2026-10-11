import { test, expect } from '@playwright/test';

// Real-hop E2E — this spec deliberately runs against the actual Spring Boot
// backend on :8080 (MySQL up, EXCHANGE_RATE_API_KEY exported) with real
// Open-Meteo / Exchange Rate API egress. It is the live verification standing
// in for the WireMock/MockServer harness that was not added. Playwright's
// webServer reuses an already-running server on :8080, so start the backend
// before running: `./mvnw spring-boot:run` (dev profile, key exported).

const TRIGGER = { name: 'Weather & Rates' } as const;

test.describe('Travel dialog — real backend hop (frontend-travel-popup)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('WHEN/THEN — open from the NavBar, pick Beijing, see live weather and rates, convert', async ({ page }) => {
    test.slow(); // live external providers: allow the tripled timeout

    const trigger = page.getByRole('button', TRIGGER);
    await expect(trigger).toBeVisible();
    await trigger.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', TRIGGER)).toBeVisible();
    // Opening the dialog must not navigate away from the home page.
    await expect(page).toHaveURL(/localhost:3000\/$/);

    // --- Weather: pick Beijing, values + attribution render ---
    await dialog.getByLabel('City').selectOption('beijing');
    await expect(dialog.getByRole('heading', { name: 'Beijing' })).toBeVisible({ timeout: 25000 });
    await expect(dialog.getByText(/^\d+(\.\d+)?°C$/).first()).toBeVisible();
    await expect(dialog.getByText(/^\d+%$/).first()).toBeVisible();
    await expect(dialog.getByText(/^\d{4}-\d{2}-\d{2}$/).first()).toBeVisible();
    await expect(dialog.getByText('Weather data by Open-Meteo (CC BY 4.0)')).toBeVisible();

    // --- Rates: curated CNY defaults auto-load with the as-of label ---
    await expect(dialog.getByText('USD', { exact: true })).toBeVisible({ timeout: 25000 });
    await expect(dialog.getByText('EUR', { exact: true })).toBeVisible();
    await expect(dialog.getByText('JPY', { exact: true })).toBeVisible();
    await expect(dialog.getByText('KRW', { exact: true })).toBeVisible();
    await expect(dialog.getByText(/^as of \d{4}-\d{2}-\d{2}$/)).toBeVisible();

    const attribution = dialog.getByRole('link', { name: 'Rates By Exchange Rate API' });
    await expect(attribution).toBeVisible();
    await expect(attribution).toHaveAttribute('href', 'https://www.exchangerate-api.com');

    // --- Free-form converter: CNY -> GBP, amount 100 ---
    await dialog.getByLabel('Quote').fill('GBP');
    await dialog.getByLabel('Amount').fill('100');
    await dialog.getByRole('button', { name: 'Convert' }).click();
    await expect(dialog.getByText(/100 CNY = [\d.]+ GBP/)).toBeVisible({ timeout: 25000 });

    // --- Quick-glance scope: no history surface, no charting ---
    await expect(dialog.getByText(/history/i)).toHaveCount(0);
    await expect(dialog.locator('table, canvas, [data-chart]')).toHaveCount(0);
  });

  test('WHEN/THEN — a travel outage shows the rates error + Retry while the dialog and page stay usable', async ({ page }) => {
    // Simulates the backend being down for the latest-rates endpoint by
    // aborting the network hop in the browser.
    await page.route('**/api/exchange-rates/**', (route) => route.abort());

    await page.getByRole('button', TRIGGER).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const retry = dialog.getByRole('button', { name: 'Retry' });
    await expect(retry).toBeVisible({ timeout: 25000 });
    await expect(dialog.getByText('Network error')).toBeVisible();

    // The dialog and the page remain usable with the failing section.
    await expect(dialog.getByRole('heading', TRIGGER)).toBeVisible();
    await expect(dialog.getByLabel('City')).toBeEnabled();

    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).not.toBeVisible();
  });
});
