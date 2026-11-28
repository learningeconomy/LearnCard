import { describe, expect, it } from 'vitest';

import { RENDERS_BEFORE_AUTH, rendersBeforeAuth } from './authGate';
import { isNeverPrerendered } from './prerender';
import { ROUTE_DATA } from './routeData';
import { ROUTE_TABLE } from './routeTable';

const privateViews = ROUTE_TABLE.filter(entry => isNeverPrerendered(entry.path));

describe('per-recipient pages (share links, shared boosts, shared resumes)', () => {
    it('are all in the route table', () => {
        expect(privateViews.map(entry => entry.path).sort()).toEqual([
            '/s/:id',
            '/share-boost',
            '/verify/resume',
        ]);
    });

    it.each(privateViews)('$path prefetches nothing into the persisted query cache', entry => {
        expect(Object.keys(ROUTE_DATA)).not.toContain(entry.page);
    });

    it.each(privateViews)('$path keeps its own start-up handling', entry => {
        // /s/* skips the start-up loader through isShareViewerPath, with its privacy handling.
        expect(rendersBeforeAuth(entry.path.replace(':id', 'abc'))).toBe(false);
        expect(RENDERS_BEFORE_AUTH.has(entry.page)).toBe(false);
    });
});

describe('pages that render before sign-in settles', () => {
    const preAuthRoutes = ROUTE_TABLE.filter(entry => RENDERS_BEFORE_AUTH.has(entry.page));

    it.each(preAuthRoutes)('$path is never a per-recipient path', entry => {
        expect(isNeverPrerendered(entry.path)).toBe(false);
    });
});
