import { defineConfig } from '@playwright/test';
import base from './playwright.mock.config';

/** Optional CLR browser matrix; no backend is required. */
export default defineConfig({
    ...base,
    testMatch: /clr-(?:numeric-scale|verification)\.mocked\.spec\.ts$/,
    projects: [
        { name: 'chromium', use: { browserName: 'chromium' } },
        { name: 'firefox', use: { browserName: 'firefox' } },
        { name: 'webkit', use: { browserName: 'webkit' } },
    ],
});
