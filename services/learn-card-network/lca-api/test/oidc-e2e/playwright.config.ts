import { defineConfig } from '@playwright/test';

if (!process.env.OIDC_E2E_RUNTIME) {
    throw new Error('Use bun run test:oidc:e2e; this suite requires its disposable services.');
}

export default defineConfig({
    testDir: '.',
    testMatch: 'broker.spec.ts',
    workers: 1,
    fullyParallel: false,
    retries: 0,
    forbidOnly: Boolean(process.env.CI),
    timeout: 30_000,
    globalTimeout: 180_000,
    expect: { timeout: 10_000 },
    reporter: 'list',
    // All artifacts, including any browser state, disappear with the runner's temp directory.
    outputDir: process.env.OIDC_E2E_OUTPUT,
    use: { browserName: 'chromium', headless: true, trace: 'off' },
});
