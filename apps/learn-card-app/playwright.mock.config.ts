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
        baseURL: 'http://localhost:3010',
        // Start unauthenticated — mocked tests drive auth through the seed flow
        // against stubbed endpoints, not a saved real session.
        storageState: undefined,
    },
    webServer: {
        // Build the LOCAL tenant config so the app points at localhost:4000/4100/5100
        // — the same backend the HAR was recorded against. The default (production)
        // config would call network.learncard.com and miss every recorded entry.
        // Use bun (the repo's declared packageManager); a `pnpm` here is rejected by
        // corepack against the bun packageManager spec.
        //
        // Compile paraglide BEFORE vite starts. Otherwise paraglideVitePlugin writes the
        // ~8MB src/paraglide/messages/_index.js while Vite's dep scanner is already
        // reading it; the scan fails on the truncated file ("Failed to scan for
        // dependencies"), so deps are discovered lazily mid-test and Vite's
        // re-optimize full-page reload lands during sign-in (flaky LaunchPad test).
        // With the output already on disk, the plugin's startup compile is a no-op.
        command:
            'bun scripts/prepare-native-config.ts learncard --stage local && bun run i18n:compile && bunx vite --host --port 3010 --strictPort',
        url: 'http://localhost:3010',
        timeout: 5 * 60 * 1000,
        reuseExistingServer: !process.env.CI,
        ignoreHTTPSErrors: true,
    },
};

export default config;
