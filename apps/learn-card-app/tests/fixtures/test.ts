import { test as base, expect } from '@playwright/test';

export const test = base.extend<{ forEachTest: void }>({
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
