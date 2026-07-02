import type { PlaywrightTestConfig } from '@playwright/test';
import base from './playwright.config';

/**
 * Mocked-network tier: runs the app against the vite dev server only (NO docker
 * backend). Tests tagged `@mocked` stub the tRPC/SSS calls via tests/mocks, so
 * this tier is fast and deterministic and can run on every PR. The real-backend
 * tier (playwright.config.ts) skips `@mocked` tests via grepInvert.
 */
const config: PlaywrightTestConfig = {
    ...base,
    // Only load the mocked specs. Collecting the full suite would pull heavy
    // app source (e.g. learn-card-base → @ionic/react) that breaks under the
    // test loader and isn't needed for this backend-free tier.
    testMatch: /\.mocked\.spec\.ts$/,
    // Clear base's grepInvert (which excludes @mocked) — this tier RUNS them.
    grepInvert: undefined,
    // The mocked specs self-authenticate via the HAR baseline; base's globalSetup
    // does a real demo email login against the backend, which this tier avoids.
    globalSetup: undefined,
    retries: 0,
    use: {
        ...base.use,
        // Start unauthenticated — mocked tests drive auth through the seed flow
        // against stubbed endpoints, not a saved real session.
        storageState: undefined,
    },
    webServer: {
        // prepare-config generates index.html + tenant-config.json; vite then
        // serves the app pointed at localhost:4000/4100/5100, which the mock
        // layer intercepts.
        command: 'pnpm prepare-config && vite --host --port 3000',
        url: 'http://localhost:3000',
        timeout: 5 * 60 * 1000,
        reuseExistingServer: !process.env.CI,
        ignoreHTTPSErrors: true,
    },
};

export default config;
