/**
 * Tests for the pure history reducer.
 *
 * Uses plain string values instead of `Pathway` literals — the
 * reducer is generic, so there's no value in coupling tests to the
 * pathway shape. Each test pins one invariant:
 *
 *   - commit pushes past, applies next, clears future
 *   - commit treats `current === next` as a no-op
 *   - commit on first transaction (no current) just applies
 *   - commit respects the maxDepth bound (drops oldest)
 *   - undo pops past, pushes current to future, applies popped
 *   - undo is a no-op when past is empty
 *   - redo shifts future, pushes current to past, applies shifted
 *   - redo is a no-op when future is empty
 *   - commit invalidates pending redo history
 *   - full round-trip (commit, commit, undo, undo, redo, redo)
 */

import { describe, expect, it } from 'vitest';

import {
    DEFAULT_MAX_HISTORY,
    commit,
    emptyHistoryState,
    redo,
    undo,
} from './historyReducer';

describe('commit', () => {
    it('pushes current into past, applies next, clears future', () => {
        const state = { past: ['a'], future: ['z'] };
        const { state: next, applied } = commit(state, 'b', 'c');

        expect(next.past).toEqual(['a', 'b']);
        expect(next.future).toEqual([]);
        expect(applied).toBe('c');
    });

    it('treats current === next as a no-op (no history pollution)', () => {
        // Mirrors `setDestinationNode` identity-preserving no-ops:
        // writing the same value shouldn't consume an undo slot.
        const state = { past: ['a'], future: [] as string[] };
        const { state: next, applied } = commit(state, 'b', 'b');

        expect(next).toBe(state);
        expect(applied).toBeNull();
    });

    it('applies on a first transaction with no current', () => {
        const state = emptyHistoryState<string>();
        const { state: next, applied } = commit(state, null, 'a');

        expect(next.past).toEqual([]);
        expect(next.future).toEqual([]);
        expect(applied).toBe('a');
    });

    it('respects maxDepth by dropping the oldest entries', () => {
        // Build a history at exactly maxDepth; committing should
        // drop the oldest entry to make room for the new one.
        const past = Array.from({ length: 3 }, (_, i) => `p${i}`);
        const state = { past, future: [] as string[] };

        const { state: next } = commit(state, 'current', 'new', 3);

        // Expected: oldest ('p0') is dropped, 'current' is now the
        // most recent past entry.
        expect(next.past).toEqual(['p1', 'p2', 'current']);
    });

    it('uses DEFAULT_MAX_HISTORY when maxDepth is not supplied', () => {
        // Not an assertion of depth (would need a huge stack);
        // just pins that the default is exported and non-zero so
        // the bound exists.
        expect(DEFAULT_MAX_HISTORY).toBeGreaterThan(0);
    });

    it('invalidates pending redo history', () => {
        // Scenario: user undoes, then edits. The redo stack should
        // be cleared — branching history is overkill for a builder
        // and leads to confusing "where did my redo go" moments.
        const state = { past: ['a'], future: ['z'] };
        const { state: next } = commit(state, 'b', 'c');

        expect(next.future).toEqual([]);
    });
});

describe('undo', () => {
    it('pops past, pushes current to future, applies popped value', () => {
        const state = { past: ['a', 'b'], future: [] as string[] };
        const { state: next, applied } = undo(state, 'c');

        expect(next.past).toEqual(['a']);
        expect(next.future).toEqual(['c']);
        expect(applied).toBe('b');
    });

    it('is a no-op when past is empty', () => {
        const state = emptyHistoryState<string>();
        const { state: next, applied } = undo(state, 'current');

        expect(next).toBe(state);
        expect(applied).toBeNull();
    });

    it('is a no-op when current is null', () => {
        // `current === null` means the caller has nothing to save
        // into the future stack. We'd rather not apply an undo at
        // all than corrupt the stack with a null entry.
        const state = { past: ['a'], future: [] as string[] };
        const { state: next, applied } = undo(state, null);

        expect(next).toBe(state);
        expect(applied).toBeNull();
    });
});

describe('redo', () => {
    it('shifts future, pushes current to past, applies shifted value', () => {
        const state = { past: ['a'], future: ['b', 'c'] };
        const { state: next, applied } = redo(state, 'current');

        expect(next.past).toEqual(['a', 'current']);
        expect(next.future).toEqual(['c']);
        expect(applied).toBe('b');
    });

    it('is a no-op when future is empty', () => {
        const state = { past: ['a'], future: [] as string[] };
        const { state: next, applied } = redo(state, 'current');

        expect(next).toBe(state);
        expect(applied).toBeNull();
    });

    it('is a no-op when current is null', () => {
        const state = { past: [] as string[], future: ['a'] };
        const { state: next, applied } = redo(state, null);

        expect(next).toBe(state);
        expect(applied).toBeNull();
    });
});

describe('round-trip', () => {
    it('commit → commit → undo → undo → redo → redo returns to the final state', () => {
        // Simulate an author editing, editing again, undoing twice
        // to the start, then redoing twice to get back. The reducer
        // should land on the same final value with matching past/future.
        let state = emptyHistoryState<string>();
        let current: string | null = null;

        const apply = (next: string) => {
            const res = commit(state, current, next);
            state = res.state;
            if (res.applied !== null) current = res.applied;
        };

        apply('v1');
        apply('v2');
        apply('v3');
        // past: ['v1','v2'], future: []

        const u1 = undo(state, current);
        state = u1.state;
        if (u1.applied !== null) current = u1.applied;
        // current = 'v2', past: ['v1'], future: ['v3']

        const u2 = undo(state, current);
        state = u2.state;
        if (u2.applied !== null) current = u2.applied;
        // current = 'v1', past: [], future: ['v2','v3']

        expect(current).toBe('v1');
        expect(state.past).toEqual([]);
        expect(state.future).toEqual(['v2', 'v3']);

        const r1 = redo(state, current);
        state = r1.state;
        if (r1.applied !== null) current = r1.applied;
        // current = 'v2', past: ['v1'], future: ['v3']

        const r2 = redo(state, current);
        state = r2.state;
        if (r2.applied !== null) current = r2.applied;
        // current = 'v3', past: ['v1','v2'], future: []

        expect(current).toBe('v3');
        expect(state.past).toEqual(['v1', 'v2']);
        expect(state.future).toEqual([]);
    });
});
