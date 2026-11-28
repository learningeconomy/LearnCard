import { defineConfig, devices } from '@playwright/test';

/**
 * Local performance runs only (not part of CI). Point PERF_URL at a production build served by
 * scripts/perf/serve-build.mjs. Build it with `STAGE=local bun run build` so the app calls the
 * localhost backends the mocked tier's HAR was recorded against.
 */
export default defineConfig({
    testDir: './tests/perf',
    testMatch: /\.perf\.ts$/,
    timeout: 10 * 60 * 1000,
    workers: 1,
    retries: 0,
    reporter: 'list',
    use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PERF_URL ?? 'http://127.0.0.1:4471',
        ignoreHTTPSErrors: true,
    },
});
