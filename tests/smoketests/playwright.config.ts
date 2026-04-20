import { defineConfig, devices } from '@playwright/test';
import { resolveUrls } from './lib/resolveUrls';

// Target environment is picked by SMOKETEST_ENV (staging|production|scouts).
// URLs are resolved from apps/learn-card-app/environments/<tenant>/config*.json
// for learncard, and from Networks.ts constants for scouts — so smoketests
// follow whatever the app is actually configured to hit.
const urls = resolveUrls();
const APP_URL = urls.app;
const API_URL = urls.api;

export default defineConfig({
    testDir: './tests',
    timeout: 30_000,
    expect: { timeout: 10_000 },
    // Lambda cold starts (scouts /api/health-check, LCA /docs) occasionally
    // 500 on the first request after idle. 2 retries absorbs that noise
    // without masking real regressions.
    retries: 2,
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

