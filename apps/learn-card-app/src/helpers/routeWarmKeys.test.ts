import { describe, expect, it } from 'vitest';

import { PREFETCH_CHUNKS, ROUTE_WARM_KEYS } from '../buildPlugins/chunkPrefetchList';

describe('ROUTE_WARM_KEYS', () => {
    it('only references keys that exist in PREFETCH_CHUNKS', () => {
        for (const key of Object.values(ROUTE_WARM_KEYS)) {
            expect(PREFETCH_CHUNKS).toHaveProperty(key);
        }
    });

    it('covers the paths ROUTE_PRELOAD warms (spot-check the map size and aliases)', () => {
        expect(ROUTE_WARM_KEYS['/wallet']).toBe('wallet');
        expect(ROUTE_WARM_KEYS['/passport']).toBe('wallet');
        expect(ROUTE_WARM_KEYS['/home']).toBe('wallet');
        expect(ROUTE_WARM_KEYS['/skills']).toBe('skills');
        expect(ROUTE_WARM_KEYS['/dashboard']).toBe('dashboard');
        // One entry per ROUTE_PRELOAD path (31 paths including the three wallet aliases).
        expect(Object.keys(ROUTE_WARM_KEYS)).toHaveLength(31);
    });
});
