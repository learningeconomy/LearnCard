import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/visual',
    testMatch: '*.spec.ts',
    timeout: 120_000,
    workers: 1,
    retries: 0,
    reporter: [['list'], ['html', { outputFolder: 'playwright-report/visual', open: 'never' }]],
    snapshotPathTemplate: '{testDir}/baselines/{projectName}/{arg}{ext}',
    use: {
        baseURL: 'http://127.0.0.1:3026',
        locale: 'en-US',
        timezoneId: 'UTC',
        reducedMotion: 'reduce',
        trace: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium-desktop',
            use: { browserName: 'chromium', viewport: { width: 1440, height: 1100 } },
        },
        {
            name: 'chromium-mobile',
            use: {
                browserName: 'chromium',
                viewport: { width: 390, height: 844 },
                isMobile: true,
                deviceScaleFactor: 1,
            },
        },
        {
            name: 'webkit-mobile',
            use: {
                browserName: 'webkit',
                viewport: { width: 390, height: 844 },
                isMobile: true,
                deviceScaleFactor: 1,
            },
        },
    ],
    webServer:
        process.env.VISUAL_EXTERNAL_SERVER === 'true'
            ? undefined
            : {
                  command:
                      'bun run i18n:compile && bunx vite build --config tests/visual/vite.config.mts && bunx vite preview --config tests/visual/vite.config.mts',
                  url: 'http://127.0.0.1:3026/tests/visual/tailwind-regression.html',
                  timeout: 300_000,
                  reuseExistingServer: !process.env.CI,
              },
});
