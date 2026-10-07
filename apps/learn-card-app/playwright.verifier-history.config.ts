import type { PlaywrightTestConfig } from '@playwright/test';
import mocked from './playwright.mock.config';

if (process.env.PWHAR === 'update')
    throw new Error(
        'Verifier history QA requires HAR replay, not recording against live services.'
    );
const webServer = mocked.webServer;
if (!webServer || Array.isArray(webServer)) throw new Error('Expected one isolated QA server.');

/** Opt-in reviewer walkthrough: real UI/signing/encryption, isolated simulated services. */
const config: PlaywrightTestConfig = {
    ...mocked,
    testMatch: 'verifier-history.qa.ts',
    workers: 1,
    fullyParallel: false,
    timeout: 5 * 60_000,
    expect: { timeout: 30_000 },
    outputDir: 'test-results/verifier-history-qa',
    reporter: [
        ['list'],
        ['html', { outputFolder: 'playwright-report/verifier-history-qa', open: 'never' }],
    ],
    use: { ...mocked.use, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
    // Never attach the synthetic account to an independently running app/server.
    webServer: { ...webServer, reuseExistingServer: false },
};

export default config;
