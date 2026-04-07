import { defineConfig, devices } from '@playwright/test';

const APP_URL = process.env.SMOKETEST_APP_URL ?? 'http://localhost:3000';
const API_URL = process.env.SMOKETEST_API_URL ?? 'http://localhost:3100';
const CLOUD_URL = process.env.SMOKETEST_CLOUD_URL ?? 'http://localhost:3200';
const LCA_API_URL = process.env.SMOKETEST_LCA_API_URL ?? 'http://localhost:3300';

export default defineConfig({
    testDir: './tests',
    timeout: 30_000,
    expect: { timeout: 10_000 },
    retries: 1,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    reporter: process.env.CI
        ? [['github'], ['html', { open: 'never' }]]
        : [['list'], ['html', { open: 'on-failure' }]],
    use: {
        baseURL: APP_URL,
        ignoreHTTPSErrors: true,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        extraHTTPHeaders: {
            'User-Agent': 'LearnCard-Smoketest/1.0',
        },
    },
    projects: [
        {
            name: 'api',
            testMatch: 'api-*.spec.ts',
            use: {
                // No browser needed — uses APIRequestContext only
                baseURL: API_URL,
            },
        },
        {
            name: 'browser',
            testMatch: 'app-*.spec.ts',
            use: {
                ...devices['Desktop Chrome'],
                baseURL: APP_URL,
            },
        },
    ],
});

// Export URLs for use in test files
export { APP_URL, API_URL, CLOUD_URL, LCA_API_URL };
