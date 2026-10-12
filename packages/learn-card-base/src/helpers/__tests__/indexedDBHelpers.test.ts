/**
 * Regression tests for clearAllIndexedDB.
 *
 * Ensures logout preserves Firebase's open database infrastructure and device
 * recovery storage while removing disposable app databases.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { clearAllIndexedDB } from '../indexedDBHelpers';
import type { KeyDerivationStrategy } from '../../auth-coordinator/types';

const logs = vi.hoisted(() => ({ warn: vi.fn() }));
vi.mock('../../logging/logger', () => ({
    getLogger: () => ({ debug: vi.fn(), error: vi.fn(), warn: logs.warn }),
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
                set onsuccess(_: unknown) {},
                set onerror(_: unknown) {},
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
        }
    );

    it('logs blocked cleanup without recording database identifiers', async () => {
        const indexedDB = mockDatabases(['app-cache']);

        await clearAllIndexedDB();
        const request = indexedDB.deleteDatabase.mock.results[0]!.value as IDBOpenDBRequest;
        request.onblocked?.call(request, new Event('blocked') as IDBVersionChangeEvent);

        expect(logs.warn).toHaveBeenCalledWith(
            'IndexedDB logout cleanup blocked by an open connection',
            { isFirebaseDatabase: false }
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
    });
});
