import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';

import { verificationBrandingPlugin } from './branding';
import { APP_ROOT } from './constants';

describe('verification branding assets', () => {
    let directory: string;
    let server: ViteDevServer;
    let origin: string;

    beforeAll(async () => {
        directory = await mkdtemp(join(tmpdir(), 'lc-verification-branding-'));
        await mkdir(join(directory, 'public'));
        await writeFile(join(directory, 'public/unrelated.txt'), 'unrelated asset');
        // Simulate a clean checkout: no generated public/branding directory.
        server = await createServer({
            root: directory,
            configFile: false,
            envFile: false,
            plugins: [verificationBrandingPlugin()],
            server: { host: '127.0.0.1', port: 0 },
        });
        await server.listen();
        const address = server.httpServer!.address();
        if (!address || typeof address === 'string') throw new Error('Missing HTTP port');
        origin = `http://127.0.0.1:${address.port}`;
    });

    afterAll(async () => {
        await server?.close();
        if (directory) await rm(directory, { recursive: true, force: true });
    });

    it('serves both wordmarks and other tracked images from a clean checkout', async () => {
        for (const [filename, mime] of [
            ['text-logo.svg', 'image/svg+xml'],
            ['text-logo-dark.svg', 'image/svg+xml'],
            ['brand-mark.png', 'image/png'],
            ['app-icon.png', 'image/png'],
            ['desktop-login-bg-alt.png', 'image/png'],
        ]) {
            const response = await fetch(`${origin}/branding/${filename}?cache=probe`);
            expect(response.status).toBe(200);
            expect(response.headers.get('content-type')).toBe(mime);
            expect(response.headers.get('cache-control')).toBe('no-store');
            const source = await readFile(
                join(APP_ROOT, 'environments/learncard/assets/branding', filename)
            );
            expect(Buffer.from(await response.arrayBuffer()).equals(source)).toBe(true);
        }
    });

    it('supports HEAD without sending the image body', async () => {
        const response = await fetch(`${origin}/branding/text-logo.svg`, { method: 'HEAD' });
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('image/svg+xml');
        expect(Number(response.headers.get('content-length'))).toBeGreaterThan(0);
        expect(await response.text()).toBe('');
    });

    it('does not serve missing images from another generated public directory', async () => {
        await mkdir(join(directory, 'public/branding'), { recursive: true });
        await writeFile(join(directory, 'public/branding/other-tenant.svg'), '<svg/>');
        await writeFile(join(directory, 'public/branding/text-logo.svg'), '<svg/>');
        // Start after creating the stale files so Vite includes them in its public cache.
        const stale = await createServer({
            root: directory,
            configFile: false,
            envFile: false,
            plugins: [verificationBrandingPlugin()],
            server: { host: '127.0.0.1', port: 0 },
        });
        try {
            await stale.listen();
            const address = stale.httpServer!.address();
            if (!address || typeof address === 'string') throw new Error('Missing HTTP port');
            const url = `http://127.0.0.1:${address.port}/branding/`;
            expect((await fetch(`${url}other-tenant.svg`)).status).toBe(404);
            const logo = await fetch(`${url}text-logo.svg`);
            expect(await logo.text()).toBe(
                await readFile(
                    join(APP_ROOT, 'environments/learncard/assets/branding/text-logo.svg'),
                    'utf8'
                )
            );
        } finally {
            await stale.close();
        }
    });

    it('rejects traversal, non-image files and malformed paths', async () => {
        for (const path of [
            'config.json',
            '%2e%2e%2fconfig.json',
            '%2e%2e%5ctext-logo.svg',
            'nested/text-logo.svg',
            'text-logo.svg%00',
        ]) {
            expect((await fetch(`${origin}/branding/${path}`)).status).toBe(404);
        }
        expect((await fetch(`${origin}/branding/%ZZ`)).status).toBe(400);
    });

    it('refuses writes and leaves other public routes to Vite', async () => {
        expect((await fetch(`${origin}/branding/text-logo.svg`, { method: 'POST' })).status).toBe(
            405
        );
        const response = await fetch(`${origin}/unrelated.txt`);
        expect(response.status).toBe(200);
        expect(await response.text()).toBe('unrelated asset');
    });
});
