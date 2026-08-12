import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
    testDir: './tests',
    timeout: 10 * 60 * 1000,
    expect: { timeout: 30_000 },
    fullyParallel: false,
    workers: 1,
    use: {
        baseURL: 'http://127.0.0.1:3000',
        trace: 'retain-on-failure',
        ignoreHTTPSErrors: true,
        ...devices['Desktop Chrome'],
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: {
        command: 'docker compose -f compose-local.yaml up --build',
        url: 'http://127.0.0.1:3000',
        timeout: 15 * 60 * 1000,
        reuseExistingServer: true,
        ignoreHTTPSErrors: true,
    },
};

export default config;
