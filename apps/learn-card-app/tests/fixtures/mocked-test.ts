import { test as base, type BrowserContext } from '@playwright/test';
import { mockDidKitWasmForContext } from '../route.helpers';

/**
 * Fixture for the mocked-network tier. Applies the local DIDKit WASM mock (so
 * signing works offline) but omits the base fixture's `:3100/delete-all`
 * cleanup, which requires the docker backend the mocked tier deliberately avoids.
 */
export const test = base.extend<{ context: BrowserContext }>({
    context: async ({ context }, use) => {
        await mockDidKitWasmForContext(context);
        await use(context);
    },
});

export { expect } from '@playwright/test';
