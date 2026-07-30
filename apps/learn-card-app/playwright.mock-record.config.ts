import type { PlaywrightTestConfig } from '@playwright/test';
import base from './playwright.config';

/**
 * Recording config for the mocked tier. Runs the `@mocked` specs against the
 * REAL docker backend (inherited base.webServer) so `installNetwork` — invoked
 * with PWHAR=update — captures the auth/boot + issuance traffic into the HAR.
 * Use via `pnpm test:e2e:mock:record`; commit the resulting tests/mocks/har/*.
 */
const config: PlaywrightTestConfig = {
    ...base,
    // Only load the mocked specs (see playwright.mock.config.ts) — collecting
    // the full suite pulls app source that breaks under the test loader.
    testMatch: /\.mocked\.spec\.ts$/,
    grep: /@mocked/,
    grepInvert: undefined,
    retries: 0,
    use: {
        ...base.use,
        storageState: undefined,
    },
};

export default config;
