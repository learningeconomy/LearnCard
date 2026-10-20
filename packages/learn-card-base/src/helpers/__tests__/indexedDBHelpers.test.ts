/**
 * Regression tests for clearAllIndexedDB.
 *
 * Ensures logout preserves Firebase's open database infrastructure and device
 * recovery storage while removing disposable app databases.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { clearAllIndexedDB } from '../indexedDBHelpers';
import type { KeyDerivationStrategy } from '../../auth-coordinator/types';

const logs = vi.hoisted(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }));
vi.mock('../../logging/logger', () => ({
    getLogger: () => logs,
}));

// ---------------------------------------------------------------------------
// Mock window.indexedDB
// ---------------------------------------------------------------------------

let deletedDBs: string[];

// clearAllIndexedDB accesses `window.indexedDB`, so we need to mock `window`.
const mockDatabases = (names: string[]) => {
    deletedDBs = [];

    const fakeIndexedDB = {
        databases: vi.fn(async () => names.map(name => ({ name }))),
        deleteDatabase: vi.fn((name: string) => {
            deletedDBs.push(name);

            return {
                onsuccess: undefined as (() => void) | undefined,
                onerror: undefined as (() => void) | undefined,
                onblocked: undefined as (() => void) | undefined,
                error: null as DOMException | null,
            };
        }),
    };

    (globalThis as Record<string, unknown>).window = { indexedDB: fakeIndexedDB };
    return fakeIndexedDB;
};

beforeEach(() => {
    deletedDBs = [];
    vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('clearAllIndexedDB', () => {
    it.each([undefined, { getPreservedStorageKeys: () => [] } as unknown as KeyDerivationStrategy])(
        'preserves Firebase databases while clearing app data (strategy: %s)',
        async strategy => {
            mockDatabases([
                'firebase-heartbeat-database',
                'firebaseLocalStorageDb',
                'firebase-installations-database',
                'app-cache',
            ]);

            await clearAllIndexedDB(strategy);

            expect(deletedDBs).toEqual(['app-cache']);
            expect(logs.info).toHaveBeenCalledWith(
                'IndexedDB logout cleanup scheduled',
                expect.objectContaining({
                    databaseCount: 4,
                    preservedCount: 3,
                    preservedFirebaseDatabases: ['auth', 'heartbeat', 'installations'],
                    deletionCount: 1,
                })
            );
        }
    );

    it('logs blocked cleanup without recording database identifiers', async () => {
        const indexedDB = mockDatabases(['app-cache']);

        await clearAllIndexedDB();
        const request = indexedDB.deleteDatabase.mock.results[0]!.value;
        request.onblocked?.();

        expect(logs.warn).toHaveBeenCalledWith(
            'IndexedDB logout cleanup blocked by an open connection',
            expect.objectContaining({ databaseKind: 'app', deletionId: 1 })
        );
    });

    it('reports completion only after pending deletions settle, including blocked and failed requests', async () => {
        const indexedDB = mockDatabases(['cache-private@example.org', 'other-cache']);
        await clearAllIndexedDB();
        const first = indexedDB.deleteDatabase.mock.results[0]!.value;
        const second = indexedDB.deleteDatabase.mock.results[1]!.value;
        const finished = (): unknown[][] =>
            logs.info.mock.calls.filter(
                ([message]) => message === 'IndexedDB logout cleanup finished'
            );

        expect(finished()).toHaveLength(0);
        first.onblocked?.();
        expect(finished()).toHaveLength(0);
        first.onsuccess?.();
        expect(finished()).toHaveLength(0);
        second.error = new DOMException('private@example.org', 'UnknownError');
        second.onerror?.();
        expect(finished()).toEqual([
            [
                'IndexedDB logout cleanup finished',
                expect.objectContaining({
                    deletionCount: 2,
                    pendingDeletions: 0,
                    failedDeletions: 1,
                }),
            ],
        ]);
        expect(logs.warn).toHaveBeenCalledWith(
            'IndexedDB logout deletion failed',
            expect.objectContaining({ deletionId: 2, errorType: 'UnknownError' })
        );
        expect(JSON.stringify([...logs.info.mock.calls, ...logs.warn.mock.calls])).not.toContain(
            'private@example.org'
        );
    });

    it('finishes immediately when all databases are preserved', async () => {
        mockDatabases(['firebaseLocalStorageDb', 'lcb-sss-keys']);
        await clearAllIndexedDB();
        expect(deletedDBs).toEqual([]);
        expect(logs.info).toHaveBeenCalledWith(
            'IndexedDB logout cleanup finished',
            expect.objectContaining({ deletionCount: 0, pendingDeletions: 0, failedDeletions: 0 })
        );
    });

    it('should NOT delete lcb-sss-keys when no strategy is provided', async () => {
        mockDatabases(['lcb-sss-keys', 'app-cache', 'some-other-db']);

        await clearAllIndexedDB();

        expect(deletedDBs).not.toContain('lcb-sss-keys');
        expect(deletedDBs).toContain('app-cache');
        expect(deletedDBs).toContain('some-other-db');
    });

    it('should NOT delete databases returned by strategy.getPreservedStorageKeys()', async () => {
        mockDatabases(['lcb-sss-keys', 'custom-preserved', 'disposable']);

        const strategy = {
            getPreservedStorageKeys: () => ['lcb-sss-keys', 'custom-preserved'],
        } as unknown as KeyDerivationStrategy;

        await clearAllIndexedDB(strategy);

        expect(deletedDBs).not.toContain('lcb-sss-keys');
        expect(deletedDBs).not.toContain('custom-preserved');
        expect(deletedDBs).toContain('disposable');
    });

    it('should skip databases with no name', async () => {
        mockDatabases(['lcb-sss-keys', '']);

        await clearAllIndexedDB();

        // Empty-name DB should not be attempted
        expect(deletedDBs).toEqual([]);
    });

    it('should default to preserving lcb-sss-keys even without strategy', async () => {
        mockDatabases(['lcb-sss-keys']);

        await clearAllIndexedDB(undefined);

        expect(deletedDBs).not.toContain('lcb-sss-keys');
    });

    it('should not throw if indexedDB.databases() fails', async () => {
        (globalThis as Record<string, unknown>).window = {
            indexedDB: {
                databases: vi.fn(async () => {
                    throw new Error('Not supported');
                }),
            },
        };

        await expect(clearAllIndexedDB()).resolves.toBeUndefined();
        expect(logs.error).toHaveBeenCalledWith(
            'IndexedDB logout cleanup failed',
            expect.objectContaining({ cleanupAttemptId: expect.any(Number), errorType: 'error' })
        );
    });
});
