import { defineConfig } from '@playwright/test';
import base from './playwright.mock.config';

/** Optional cross-browser matrix for the unsigned CLR demo; no backend is required. */
export default defineConfig({
    ...base,
    testMatch: /clr-numeric-scale\.mocked\.spec\.ts$/,
    projects: [
        { name: 'chromium', use: { browserName: 'chromium' } },
        { name: 'firefox', use: { browserName: 'firefox' } },
        { name: 'webkit', use: { browserName: 'webkit' } },
    ],
});
