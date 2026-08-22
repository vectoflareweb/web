import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for end-to-end visual sweeps (e.g. the admin console).
 *
 * These are NOT part of the unit/integration suite (`pnpm test`, Vitest) — they
 * drive a real Chromium against a running dev server to capture screenshots and
 * exercise client-only behaviour (drawers, theme toggle, toasts) that Vitest
 * cannot. Run them where a browser can actually launch:
 *
 *   npx playwright install chromium     # one-time: download the browser
 *   pnpm e2e                          # runs everything in ./e2e
 *
 * The `webServer` below migrates + seeds the local D1 and boots `pnpm dev`
 * before the tests, and tears it down after. See e2e/README.md.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm db:migrate:local && pnpm db:seed:local && pnpm dev',
    url: 'http://localhost:3000/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
