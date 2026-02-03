import { test as base, expect, BrowserContext } from '@playwright/test';
import { mockDidKitWasmForContext } from '../route.helpers';

export const test = base.extend<{ forEachTest: void; context: BrowserContext }>({
    // Override context fixture to apply WASM interception automatically
    context: async ({ context }, use) => {
        // Intercept DIDKit WASM requests to serve local file instead of CDN
        // This significantly speeds up test startup by avoiding ~9MB network fetch
        await mockDidKitWasmForContext(context);
        await use(context);
    },

    forEachTest: [
        async ({ request, browser }, use) => {
            await use();

            await Promise.all(
                browser.contexts().map(context => {
                    return Promise.all(context.pages()?.map(page => page.close()) ?? []);
                })
            );

            // This code runs after every test.
            const response = await request.post('http://localhost:3100/delete-all');
            expect(response.ok()).toBeTruthy();
        },
        { auto: true },
    ], // automatically starts for every test.
});
