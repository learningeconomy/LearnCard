import type { PlaywrightTestConfig } from '@playwright/test';

import baseConfig from './playwright.config';

// Accessibility journeys use the repository's Docker-backed Playwright stack.
// This preserves the real sign-in, issuance, claim, and share integrations.
const config: PlaywrightTestConfig = {
    ...baseConfig,

    // This suite runs straight after the main Playwright suite, in the same
    // workspace on the E2E runner. The base config writes its HTML report to
    // playwright-report/ and its traces and results.json to test-results/, so
    // without these overrides the Axe run silently overwrites the report of the
    // suite that just ran. Keep both sets of artifacts.
    outputDir: 'test-results-a11y',
    reporter: [
        [process.env.CI ? 'dot' : 'list'],
        ['html', { open: 'never', outputFolder: 'playwright-report-a11y' }],
        ['json', { outputFile: 'test-results-a11y/results.json' }],
        // GitHub Actions reporter - shows results in job summary
        ...(process.env.CI ? [['github'] as const] : []),
    ],
};

export default config;
