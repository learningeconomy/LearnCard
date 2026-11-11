import { defineConfig, devices } from '@playwright/test';

// Real browser storage + Firebase SDK, with intercepted APIs and no app backend.
export default defineConfig({
    testDir: './tests/auth',
    outputDir: './coverage/playwright-auth',
    reporter: 'list',
    timeout: 15_000,
    workers: 1,
    use: { ...devices['Desktop Chrome'], trace: 'retain-on-failure' },
});
