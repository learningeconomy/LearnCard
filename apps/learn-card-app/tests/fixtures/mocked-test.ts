import { test as base, type BrowserContext } from '@playwright/test';
import {
    mockDidKitWasmForContext,
    mockLaunchDarkly,
    type MockFeatureFlags,
} from '../route.helpers';

/**
 * Fixture for the mocked-network tier. Pins feature flags and applies the local
 * DIDKit WASM mock, without the real fixture's docker-backed cleanup.
 */
export const test = base.extend<{ context: BrowserContext; featureFlags: MockFeatureFlags }>({
    featureFlags: [{}, { option: true }],
    context: async ({ context, featureFlags }, runTest) => {
        await mockLaunchDarkly(context, featureFlags);
        await mockDidKitWasmForContext(context);
        await runTest(context);
    },
});

export { expect } from '@playwright/test';
