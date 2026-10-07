import type { PlaywrightTestConfig } from '@playwright/test';
import base from './playwright.config';

/** Only suites using isolated-test may share a backend stack across workers. */
const config: PlaywrightTestConfig = {
    ...base,
    testMatch: /(?:consent-flow-race|app-store|wallet-credentials)\.spec\.ts$/,
    globalSetup: undefined,
    workers: 2,
    fullyParallel: true,
    use: { ...base.use, storageState: { cookies: [], origins: [] } },
};

export default config;
