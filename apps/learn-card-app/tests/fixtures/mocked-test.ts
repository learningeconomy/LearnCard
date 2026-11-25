import { test as base, type BrowserContext } from '@playwright/test';
import { resolve } from 'path';
import {
    mockDidKitWasmForContext,
    mockLaunchDarkly,
    type MockFeatureFlags,
} from '../route.helpers';

/**
 * Fixture for the mocked-network tier. Pins feature flags, connectivity and local
 * DIDKit WASM, without the real fixture's docker-backed cleanup.
 */
export const test = base.extend<{ context: BrowserContext; featureFlags: MockFeatureFlags }>({
    featureFlags: [{}, { option: true }],
    context: async ({ context, featureFlags }, runTest) => {
        await mockLaunchDarkly(context, featureFlags);
        await mockDidKitWasmForContext(context);
        // Backend aborts can trigger reachability checks during cold Vite loads.
        // This tier owns connectivity too; replay the app's real static marker.
        await context.route(/\/connectivity\.txt(?:\?.*)?$/, route =>
            route.fulfill({
                contentType: 'text/plain',
                path: resolve(__dirname, '../../public/connectivity.txt'),
            })
        );
        await runTest(context);
    },
});

export { expect } from '@playwright/test';
