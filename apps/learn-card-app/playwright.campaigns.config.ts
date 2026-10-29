import { devices, type PlaywrightTestConfig } from '@playwright/test';
import mocked from './playwright.mock.config';

if (process.env.PWHAR === 'update') throw new Error('Campaign QA requires mocked services.');
const webServer = mocked.webServer;
if (!webServer || Array.isArray(webServer)) throw new Error('Expected one isolated QA server.');

/** Local synthetic review flow. The ordinary mocked CI tier also discovers this spec. */
const config: PlaywrightTestConfig = {
    ...mocked,
    testMatch: 'campaigns.mocked.spec.ts',
    fullyParallel: false,
    workers: 1,
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    use: { ...mocked.use, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
    webServer: { ...webServer, reuseExistingServer: false },
};
export default config;
