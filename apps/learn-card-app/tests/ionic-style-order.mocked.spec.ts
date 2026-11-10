import { mkdtemp, readFile, rm } from 'node:fs/promises';
import type { Server } from 'node:http';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { expect, test } from './fixtures/mocked-test';

let directory: string;
let server: Server;
let origin: string;

test.beforeAll(async () => {
    const { createFixtureServer } = await import('../../../scripts/verify-web-sqlite-build.mjs');
    const { build } = await import('vite');
    const { default: tailwindcss } = await import('@tailwindcss/vite');
    directory = await mkdtemp(resolve(tmpdir(), 'learncard-ionic-style-order-'));
    const app = resolve(__dirname, '..');
    const template = await readFile(resolve(app, 'index.template.html'), 'utf8');
    await build({
        configFile: false,
        envFile: false,
        root: app,
        publicDir: false,
        logLevel: 'warn',
        plugins: [
            tailwindcss(),
            {
                name: 'ionic-style-order-fixture',
                transformIndexHtml: {
                    order: 'pre',
                    handler: () =>
                        template
                            // The fixture only needs Ionic and app CSS, not startup polyfills.
                            .replace(/<script type="module">[\s\S]*?<\/script>/, '')
                            .replace('/src/index', '/tests/ionic-style-order/main.ts'),
                },
            },
        ],
        build: {
            outDir: directory,
            emptyOutDir: false,
            rollupOptions: { input: resolve(app, 'index.template.html') },
        },
    });
    server = createFixtureServer(directory);
    await new Promise<void>(ready => server.listen(0, '127.0.0.1', ready));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing fixture server port');
    origin = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
    if (server) await new Promise<void>(done => server.close(() => done()));
    if (directory) await rm(directory, { recursive: true, force: true });
});

for (const mode of ['md', 'ios']) {
    for (const hasAnchor of [true, false]) {
        test(`production CSS ${mode}: ${hasAnchor ? 'restores app styling' : 'reproduces regression without anchor'} @mocked`, async ({
            page,
        }) => {
            const sqliteCdnRequests: string[] = [];
            page.on('request', request => {
                if (request.url().includes('cdn.jsdelivr.net/npm/jeep-sqlite')) {
                    sqliteCdnRequests.push(request.url());
                }
            });
            if (!hasAnchor) {
                await page.route('**/index.template.html?*', async route => {
                    const response = await route.fetch();
                    const html = (await response.text()).replace(
                        '<style id="ionic-runtime-style-anchor"></style>',
                        ''
                    );
                    await route.fulfill({ response, body: html });
                });
            }
            await page.goto(`${origin}/index.template.html?mode=${mode}`);
            const result = page.locator('#appearance');
            await expect(result).toHaveText(/^\{/);
            const appearance = JSON.parse(await result.innerText());
            expect(appearance.mode).toBe(mode);
            expect(appearance.inputPadding).toEqual(hasAnchor ? ['44px', '48px'] : ['0px', '0px']);
            expect(appearance.listBackground).toBe(
                hasAnchor ? 'rgb(239, 240, 245)' : 'rgb(255, 255, 255)'
            );
            const mdDefaultsWin = !hasAnchor && mode === 'md';
            expect(appearance.listPadding).toBe(mdDefaultsWin ? '8px' : '16px');
            expect(appearance.listMargin).toBe(mdDefaultsWin ? '0px' : '16px');
            expect(sqliteCdnRequests).toEqual([]);
        });
    }
}
