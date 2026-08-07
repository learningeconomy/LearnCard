import type { PlaywrightTestConfig } from '@playwright/test';

import baseConfig from './playwright.config';

// Accessibility journeys use the repository's Docker-backed Playwright stack.
// This preserves the real sign-in, issuance, claim, and share integrations.
const config: PlaywrightTestConfig = {
    ...baseConfig,
};

export default config;
