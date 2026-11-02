/**
 * Regression tests for clearUserData & PRESERVED_TABLES.
 *
 * These tests guarantee that logout cleanup never destroys
 * the SSS device share stored in the `sss_shares` SQLite table.
 *
 * See: useSQLiteStorage.ts — clearUserData()
 * See: indexedDBHelpers.ts — clearAllIndexedDB()
 */

import { DatabaseSync } from 'node:sqlite';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SQLiteDBConnection } from '@capacitor-community/sqlite';

import { clearUserData, PRESERVED_TABLES } from '../../SQL/clearUserData';

// ---------------------------------------------------------------------------
// Mock SQLiteDBConnection factory
// ---------------------------------------------------------------------------

interface QueryLog {
    statement: string;
}

const createMockDB = (tables: string[] = []) => {
    const queries: QueryLog[] = [];
    let isOpen = false;

    const db: Pick<SQLiteDBConnection, 'open' | 'close' | 'query' | 'isDBOpen'> = {
        open: vi.fn(async () => {
            isOpen = true;
        }),

        close: vi.fn(async () => {
            isOpen = false;
        }),

        isDBOpen: vi.fn(async () => ({ result: isOpen })),

        query: vi.fn(async (statement: string) => {
            queries.push({ statement });

            // Return table list when sqlite_master is queried
            if (statement.includes('sqlite_master')) {
                return {
                    values: tables.filter(t => !PRESERVED_TABLES.has(t)).map(name => ({ name })),
                };
            }

            return { values: [] };
        }),
    };

    return { db: db as unknown as SQLiteDBConnection, queries };
};

// ---------------------------------------------------------------------------
// Tests — clearUserData (SQLite logout cleanup)
// ---------------------------------------------------------------------------

describe('clearUserData', () => {
    it('should always include sss_shares in the preserved set', () => {
        expect(PRESERVED_TABLES.has('sss_shares')).toBe(true);
    });

    it('should always include sqlite_sequence in the preserved set', () => {
        expect(PRESERVED_TABLES.has('sqlite_sequence')).toBe(true);
    });

    it('should clear users and tokens tables', async () => {
        const { db, queries } = createMockDB(['users', 'tokens']);

        await clearUserData(db);

        const statements = queries.map(q => q.statement);

        expect(statements).toContain('DELETE FROM "users"');
        expect(statements).toContain('DELETE FROM "tokens"');
    });

    it('should NOT issue DELETE FROM sss_shares', async () => {
        const { db, queries } = createMockDB(['users', 'tokens', 'sss_shares', 'some_other_table']);

        await clearUserData(db);

        const statements = queries.map(q => q.statement);

        expect(statements).not.toContain('DELETE FROM sss_shares');
        expect(statements).toContain('DELETE FROM "some_other_table"');
    });

    it('should clear dynamically-discovered tables (except preserved)', async () => {
        const { db, queries } = createMockDB([
            'users',
            'tokens',
            'credentials_cache',
            'sss_shares',
        ]);

        await clearUserData(db);

        const statements = queries.map(q => q.statement);

        expect(statements).toContain('DELETE FROM "credentials_cache"');
        expect(statements).not.toContain('DELETE FROM sss_shares');
    });

    it('should open the DB before queries and close it after', async () => {
        const { db } = createMockDB(['users', 'tokens']);

        await clearUserData(db);

        expect(db.open).toHaveBeenCalled();
        expect(db.close).toHaveBeenCalled();
    });

    it('should not throw when db.query fails', async () => {
        const db = {
            open: vi.fn(async () => {}),
            close: vi.fn(async () => {}),
            isDBOpen: vi.fn(async () => ({ result: false })),
            query: vi.fn(async () => {
                throw new Error('SQL error');
            }),
        } as unknown as SQLiteDBConnection;

        // Should not reject
        await expect(clearUserData(db)).resolves.toBeUndefined();
    });

    it('should never call deleteDatabase or db.delete', async () => {
        const deleteFn = vi.fn();

        const db = {
            open: vi.fn(async () => {}),
            close: vi.fn(async () => {}),
            isDBOpen: vi.fn(async () => ({ result: true })),
            delete: deleteFn,
            query: vi.fn(async () => ({ values: [] })),
        } as unknown as SQLiteDBConnection;

        await clearUserData(db);

        expect(deleteFn).not.toHaveBeenCalled();
    });

    it('should build the sqlite_master query with all preserved tables', async () => {
        const { db, queries } = createMockDB(['users', 'tokens']);

        await clearUserData(db);

        const masterQuery = queries.find(q => q.statement.includes('sqlite_master'));

        expect(masterQuery).toBeDefined();

        // Every preserved table must appear in the NOT IN clause
        for (const table of PRESERVED_TABLES) {
            expect(masterQuery!.statement).toContain(`'${table}'`);
        }
    });

    it.each([{ accountTables: [] }, { accountTables: ['users'] }, { accountTables: ['tokens'] }])(
        'clears real SQLite caches when only these account tables exist: $accountTables',
        async ({ accountTables }) => {
            const sqlite = new DatabaseSync(':memory:');
            try {
                const tables = [...accountTables, 'reactQuery', 'credentialsCache', 'sss_shares'];
                for (const table of tables) {
                    sqlite.exec(`CREATE TABLE "${table}" (value TEXT);`);
                    sqlite.prepare(`INSERT INTO "${table}" VALUES (?)`).run('synthetic data');
                }
                const db = {
                    open: async () => undefined,
                    close: async () => undefined,
                    query: async (sql: string) => ({ values: sqlite.prepare(sql).all() }),
                } as unknown as SQLiteDBConnection;
                await clearUserData(db);
                for (const table of tables) {
                    expect(sqlite.prepare(`SELECT * FROM "${table}"`).all()).toHaveLength(
                        table === 'sss_shares' ? 1 : 0
                    );
                }
            } finally {
                sqlite.close();
            }
        }
    );

    it('continues clearing later tables after one delete fails', async () => {
        const { db, queries } = createMockDB(['users', 'reactQuery', 'credentialsCache']);
        const query = vi.mocked(db.query).getMockImplementation()!;
        vi.spyOn(db, 'query').mockImplementation(async (sql: string) => {
            if (sql === 'DELETE FROM "users"') throw new Error('synthetic delete failure');
            return query(sql);
        });
        await clearUserData(db);
        expect(queries.map(q => q.statement)).toContain('DELETE FROM "reactQuery"');
        expect(queries.map(q => q.statement)).toContain('DELETE FROM "credentialsCache"');
    });

    it('quotes discovered table names as identifiers', async () => {
        const { db, queries } = createMockDB(['quoted"table']);
        await clearUserData(db);
        expect(queries.map(q => q.statement)).toContain('DELETE FROM "quoted""table"');
    });
});

// ---------------------------------------------------------------------------
// Tests — PRESERVED_TABLES constant
// ---------------------------------------------------------------------------

describe('PRESERVED_TABLES', () => {
    it('sss_shares must be preserved (regression guard)', () => {
        // If someone removes sss_shares from the set, this test will catch it.
        expect(PRESERVED_TABLES.has('sss_shares')).toBe(true);
    });

    it('should be a non-empty Set', () => {
        expect(PRESERVED_TABLES.size).toBeGreaterThan(0);
    });
});
