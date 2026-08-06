import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  expect: { timeout: 10000 },
  retries: process.env.CI ? 1 : 1,
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npx tsx tests/e2e/mock-server.ts',
      port: 8080,
      stdout: 'pipe',
      stderr: 'pipe',
      cwd: './',
      reuseExistingServer: true,
    },
    {
      command: 'npm run dev',
      port: 3000,
      stdout: 'pipe',
      stderr: 'pipe',
      cwd: './',
      reuseExistingServer: true,
    },
  ],
});
