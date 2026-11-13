import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './browser-tests',
    testMatch: '*.browser.ts',
    timeout: 30_000,
    retries: 0,
    workers: 1,
    forbidOnly: !!process.env.CI,
    reporter: 'list',
    // Generated private test keys stay in memory; do not record traces.
    use: { trace: 'off', serviceWorkers: 'block', launchOptions: { timeout: 15_000 } },
    projects: [
        { name: 'chromium', use: { browserName: 'chromium' } },
        { name: 'firefox', use: { browserName: 'firefox' } },
    ],
});
