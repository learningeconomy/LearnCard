import { defineConfig, devices } from '@playwright/test';

// Moved from the AI-Passport repo root. Run from apps/ai-passport: `bun run test:e2e`.
// These specs drive the full chat flow, so they need the backend and workers running
// (services/ai-passport-backend `bun run dev` and `bun run dev:workers`).
const frontendPort = process.env.AIP_TEST_FRONTEND_PORT ?? '4321';
const baseURL = `http://localhost:${frontendPort}`;

export default defineConfig({
    timeout: 240 * 1000,
    testDir: 'tests/e2e',
    workers: process.env.CI ? 1 : undefined,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    // Stop after the first exhausted failure so CI reaches diagnostics before its job deadline.
    maxFailures: process.env.CI ? 1 : undefined,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL,
        trace: process.env.CI ? 'retain-on-failure' : 'on-first-retry',
        video: process.env.CI ? 'retain-on-failure' : 'off',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: `bun run dev -- --port ${frontendPort}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        stdout: 'pipe',
        stderr: 'pipe',
    },
});
