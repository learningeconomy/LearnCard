import { describe, expect, it } from 'vitest';

import { PRERENDER_PATHS, isNeverPrerendered, safePrerenderPaths } from './prerender';

describe('prerender paths', () => {
    it('prerenders only public shells', () => {
        expect(safePrerenderPaths(PRERENDER_PATHS)).toEqual([
            '/login',
            '/legal/terms',
            '/legal/privacy',
        ]);
    });

    it.each([
        '/s',
        '/s/abc123',
        '/share-boost',
        '/share-boost/x',
        '/verify/resume',
        '/verify/resume/1',
    ])('never prerenders %s', pathname => {
        expect(isNeverPrerendered(pathname)).toBe(true);
        expect(() => safePrerenderPaths([pathname])).toThrow(/private paths/);
    });

    it.each(['/settings', '/share-creds', '/verify', '/legal/terms'])('allows %s', pathname => {
        expect(isNeverPrerendered(pathname)).toBe(false);
    });
});
