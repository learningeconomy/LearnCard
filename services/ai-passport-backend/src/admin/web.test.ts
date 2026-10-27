import { expect, test } from 'bun:test';
import { handleAdminWeb } from './web';
test('backend bundle is gated, local-only, uncached and traversal-safe', async () => {
    const prior = process.env.EMBEDDINGS_ADMIN_ENABLED;
    try {
        delete process.env.EMBEDDINGS_ADMIN_ENABLED;
        expect(
            (await handleAdminWeb(new Request('https://ai-passport.fly.dev/admin')))?.status
        ).toBe(404);
        process.env.EMBEDDINGS_ADMIN_ENABLED = 'true';
        for (const origin of ['https://lca-backend.fly.dev', 'https://ai-passport.fly.dev']) {
            const page = await handleAdminWeb(new Request(origin + '/admin'));
            expect(page?.status).toBe(200);
            const html = await page!.text();
            expect(html).toContain('/admin/assets/admin.js');
            expect(html).not.toContain('did:');
            expect(page!.headers.get('Cache-Control')).toBe('no-store');
            expect(page!.headers.get('Content-Security-Policy')).not.toContain('unsafe-inline');
            for (const asset of ['admin.js', 'admin.css'])
                expect(
                    (await handleAdminWeb(new Request(origin + '/admin/assets/' + asset)))?.status
                ).toBe(200);
        }
        for (const path of [
            '%2e%2e%2fpackage.json',
            '%2Fetc%2Fpasswd',
            'unknown.js',
            'admin.js/extra',
        ])
            expect(
                (
                    await handleAdminWeb(
                        new Request('https://ai-passport.fly.dev/admin/assets/' + path)
                    )
                )?.status
            ).toBe(404);
        expect(
            (
                await handleAdminWeb(
                    new Request('https://ai-passport.fly.dev/admin', { method: 'POST' })
                )
            )?.status
        ).toBe(405);
    } finally {
        if (prior === undefined) delete process.env.EMBEDDINGS_ADMIN_ENABLED;
        else process.env.EMBEDDINGS_ADMIN_ENABLED = prior;
    }
});
