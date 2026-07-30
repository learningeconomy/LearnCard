import { describe, expect, it } from 'vitest';

import { diffRoutes } from './routeDiff';

describe('diffRoutes', () => {
    it('returns hasChanges=false when both routes are undefined', () => {
        const d = diffRoutes(undefined, undefined);
        expect(d.hasChanges).toBe(false);
        expect(d.kept).toEqual([]);
        expect(d.removed).toEqual([]);
        expect(d.added).toEqual([]);
        expect(d.steps).toEqual([]);
    });

    it('returns hasChanges=false when both routes are empty', () => {
        const d = diffRoutes([], []);
        expect(d.hasChanges).toBe(false);
    });

    it('returns hasChanges=false when routes are identical', () => {
        const d = diffRoutes(['a', 'b', 'c'], ['a', 'b', 'c']);

        expect(d.hasChanges).toBe(false);
        expect(d.kept).toEqual(['a', 'b', 'c']);
        expect(d.removed).toEqual([]);
        expect(d.added).toEqual([]);
    });

    it('reports removals in current-route order', () => {
        const d = diffRoutes(['a', 'b', 'c', 'd'], ['a', 'd']);

        expect(d.hasChanges).toBe(true);
        expect(d.kept).toEqual(['a', 'd']);
        expect(d.removed).toEqual(['b', 'c']);
        expect(d.added).toEqual([]);
    });

    it('reports additions in proposed-route order', () => {
        const d = diffRoutes(['a', 'd'], ['a', 'b', 'c', 'd']);

        expect(d.added).toEqual(['b', 'c']);
        expect(d.removed).toEqual([]);
    });

    it('handles undefined current as pure additive', () => {
        const d = diffRoutes(undefined, ['a', 'b']);

        expect(d.added).toEqual(['a', 'b']);
        expect(d.kept).toEqual([]);
        expect(d.removed).toEqual([]);
    });

    it('handles undefined proposed as pure removal', () => {
        const d = diffRoutes(['a', 'b'], undefined);

        expect(d.removed).toEqual(['a', 'b']);
        expect(d.kept).toEqual([]);
        expect(d.added).toEqual([]);
    });

    it('produces linearized steps: proposed route first, then removed', () => {
        const d = diffRoutes(['a', 'b', 'c'], ['a', 'c', 'x']);

        expect(d.steps).toEqual([
            { id: 'a', status: 'kept', index: 0 },
            { id: 'c', status: 'kept', index: 1 },
            { id: 'x', status: 'added', index: 2 },
            { id: 'b', status: 'removed', index: 1 },
        ]);
    });

    it('assigns indices relative to proposed route for kept/added steps', () => {
        // Useful for the UI to render "step N of M" labels.
        const d = diffRoutes(['a', 'b', 'c'], ['a', 'c']);
        const kept = d.steps.filter(s => s.status !== 'removed');

        expect(kept).toEqual([
            { id: 'a', status: 'kept', index: 0 },
            { id: 'c', status: 'kept', index: 1 },
        ]);
    });
});
