import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT || 8899);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
    testDir: './e2e',
    timeout: 30_000,
    expect: { timeout: 5_000 },
    fullyParallel: true,
    reporter: process.env.CI ? [['github'], ['list']] : 'list',
    use: {
        baseURL: BASE_URL,
        trace: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'node serve.js',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 10_000,
        env: { PORT: String(PORT) },
    },
});
