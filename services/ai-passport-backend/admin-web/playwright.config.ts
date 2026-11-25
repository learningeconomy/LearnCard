import { defineConfig } from '@playwright/test';
export default defineConfig({
    testDir: './tests',
    testMatch: 'admin.spec.ts',
    workers: 1,
    use: { baseURL: 'http://localhost:4349', browserName: 'chromium' },
    webServer: {
        cwd: new URL('..', import.meta.url).pathname,
        command: 'bun run build:admin && bun scripts/serve-admin-fixture.ts',
        url: 'http://localhost:4349/admin',
        reuseExistingServer: false,
    },
    reporter: 'list',
});
