import { describe, it, expect } from 'vitest';

import { pruneOrphanedRecoveryMethods } from './pruneOrphanedRecoveryMethods';

import type { RecoveryMethod } from './UserKey';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeMethod = (
    type: 'passkey' | 'backup' | 'phrase',
    shareVersion?: number,
): RecoveryMethod => ({
    type,
    createdAt: new Date('2024-01-01'),
    shareVersion,
});

// ---------------------------------------------------------------------------
// pruneOrphanedRecoveryMethods — pure function tests
// ---------------------------------------------------------------------------

describe('pruneOrphanedRecoveryMethods', () => {

    // ── Basics ──────────────────────────────────────────────────────

    it('returns empty array when no recovery methods exist', () => {
        const result = pruneOrphanedRecoveryMethods([], 7, [2, 3, 4, 5, 6]);

        expect(result).toEqual([]);
    });

    it('keeps method whose shareVersion matches the current version', () => {
        const methods = [makeMethod('passkey', 5)];
        const result = pruneOrphanedRecoveryMethods(methods, 5, [1, 2, 3, 4]);

        expect(result).toHaveLength(1);
        expect(result[0]!.shareVersion).toBe(5);
    });

    it('keeps method whose shareVersion matches a previous version', () => {
        const methods = [makeMethod('passkey', 3)];
        const result = pruneOrphanedRecoveryMethods(methods, 7, [3, 4, 5, 6]);

        expect(result).toHaveLength(1);
        expect(result[0]!.shareVersion).toBe(3);
    });

    it('prunes method whose shareVersion has been evicted', () => {
        const methods = [makeMethod('passkey', 1)];
        // Current = 7, previous = [3,4,5,6] — version 1 is gone
        const result = pruneOrphanedRecoveryMethods(methods, 7, [3, 4, 5, 6]);

        expect(result).toHaveLength(0);
    });

    // ── Legacy / unversioned methods ────────────────────────────────

    it('keeps methods with no shareVersion (legacy/unversioned)', () => {
        const methods = [makeMethod('passkey', undefined)];
        const result = pruneOrphanedRecoveryMethods(methods, 10, [6, 7, 8, 9]);

        expect(result).toHaveLength(1);
    });

    it('keeps methods with shareVersion explicitly set to undefined', () => {
        const method: RecoveryMethod = {
            type: 'phrase',
            createdAt: new Date(),
            shareVersion: undefined,
        };

        const result = pruneOrphanedRecoveryMethods([method], 5, [1, 2, 3, 4]);

        expect(result).toHaveLength(1);
    });

    // ── Mixed scenarios ─────────────────────────────────────────────

    it('keeps valid methods and prunes orphaned ones in a mixed set', () => {
        const methods = [
            makeMethod('passkey', 7),   // current → keep
            makeMethod('phrase', 4),    // in previous → keep
            makeMethod('backup', 1),    // evicted → prune
        ];

        const result = pruneOrphanedRecoveryMethods(methods, 7, [3, 4, 5, 6]);

        expect(result).toHaveLength(2);
        expect(result.map(m => m.type)).toEqual(['passkey', 'phrase']);
    });

    it('keeps legacy methods alongside versioned ones', () => {
        const methods = [
            makeMethod('passkey', 5),        // current → keep
            makeMethod('phrase', undefined),  // legacy → keep
            makeMethod('backup', 1),         // evicted → prune
        ];

        const result = pruneOrphanedRecoveryMethods(methods, 5, [2, 3, 4]);

        expect(result).toHaveLength(2);
        expect(result.map(m => m.type)).toEqual(['passkey', 'phrase']);
    });

    // ── No previous versions ────────────────────────────────────────

    it('only keeps current-version methods when no previous shares exist', () => {
        const methods = [
            makeMethod('passkey', 1),  // current → keep
            makeMethod('phrase', 1),   // current → keep
        ];

        const result = pruneOrphanedRecoveryMethods(methods, 1, []);

        expect(result).toHaveLength(2);
    });

    it('prunes non-current methods when no previous shares exist', () => {
        const methods = [
            makeMethod('passkey', 1),  // current → keep
            makeMethod('phrase', 2),   // no match → prune
        ];

        const result = pruneOrphanedRecoveryMethods(methods, 1, []);

        expect(result).toHaveLength(1);
        expect(result[0]!.type).toBe('passkey');
    });

    // ── Boundary: version at the edge of the window ─────────────────

    it('keeps method at the oldest surviving previous version', () => {
        // previous = [3, 4, 5, 6, 7], current = 8
        // version 3 is the oldest surviving → keep
        const methods = [makeMethod('passkey', 3)];
        const result = pruneOrphanedRecoveryMethods(methods, 8, [3, 4, 5, 6, 7]);

        expect(result).toHaveLength(1);
    });

    it('prunes method one version below the oldest surviving', () => {
        // previous = [3, 4, 5, 6, 7], current = 8
        // version 2 is just below the window → prune
        const methods = [makeMethod('passkey', 2)];
        const result = pruneOrphanedRecoveryMethods(methods, 8, [3, 4, 5, 6, 7]);

        expect(result).toHaveLength(0);
    });

    // ── Multiple methods on the same version ────────────────────────

    it('keeps multiple methods that share the same valid version', () => {
        const methods = [
            makeMethod('passkey', 5),
            makeMethod('phrase', 5),
        ];

        const result = pruneOrphanedRecoveryMethods(methods, 5, [1, 2, 3, 4]);

        expect(result).toHaveLength(2);
    });

    it('prunes multiple methods that share the same orphaned version', () => {
        const methods = [
            makeMethod('passkey', 1),
            makeMethod('phrase', 1),
        ];

        const result = pruneOrphanedRecoveryMethods(methods, 7, [3, 4, 5, 6]);

        expect(result).toHaveLength(0);
    });

    // ── All methods orphaned ────────────────────────────────────────

    it('returns empty array when all methods are orphaned', () => {
        const methods = [
            makeMethod('passkey', 1),
            makeMethod('phrase', 2),
            makeMethod('backup', 0),
        ];

        const result = pruneOrphanedRecoveryMethods(methods, 10, [6, 7, 8, 9]);

        expect(result).toHaveLength(0);
    });

    // ── All methods valid ───────────────────────────────────────────

    it('keeps all methods when none are orphaned', () => {
        const methods = [
            makeMethod('passkey', 5),
            makeMethod('phrase', 3),
            makeMethod('backup', 4),
        ];

        const result = pruneOrphanedRecoveryMethods(methods, 5, [2, 3, 4]);

        expect(result).toHaveLength(3);
    });

    // ── Guards against overpruning ──────────────────────────────────

    it('does NOT prune the method that was JUST created on the new current version', () => {
        // Simulates: user just set up a passkey at version 7 (the new current)
        const methods = [makeMethod('passkey', 7)];
        const result = pruneOrphanedRecoveryMethods(methods, 7, [2, 3, 4, 5, 6]);

        expect(result).toHaveLength(1);
    });

    it('does NOT prune methods when history is empty and method is on current', () => {
        // Brand new user, first recovery method, version 1
        const methods = [makeMethod('passkey', 1)];
        const result = pruneOrphanedRecoveryMethods(methods, 1, []);

        expect(result).toHaveLength(1);
    });

    it('does NOT prune unversioned methods even when all versioned ones are orphaned', () => {
        const methods = [
            makeMethod('passkey', 1),        // orphaned → prune
            makeMethod('phrase', undefined),  // unversioned → keep
        ];

        const result = pruneOrphanedRecoveryMethods(methods, 10, [6, 7, 8, 9]);

        expect(result).toHaveLength(1);
        expect(result[0]!.type).toBe('phrase');
    });

    // ── Realistic scenario: 8 share rotations with cap of 5 ────────

    it('correctly prunes across a realistic multi-rotation scenario', () => {
        // User started at v1, has rotated 7 times → current = 8
        // previousAuthShares keeps [4, 5, 6, 7] (v3 was just evicted)
        //
        // Recovery methods:
        //   passkey at v2 → evicted → prune
        //   phrase at v5  → in previous → keep
        //   backup at v8  → current → keep
        const methods = [
            makeMethod('passkey', 2),
            makeMethod('phrase', 5),
            makeMethod('backup', 8),
        ];

        const result = pruneOrphanedRecoveryMethods(methods, 8, [4, 5, 6, 7]);

        expect(result).toHaveLength(2);
        expect(result.map(m => m.type)).toEqual(['phrase', 'backup']);
    });
});

