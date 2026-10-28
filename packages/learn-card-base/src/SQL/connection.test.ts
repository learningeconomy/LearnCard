import { describe, expect, it, vi } from 'vitest';
import type { SQLiteDBConnection } from '@capacitor-community/sqlite';
import {
    ensureSQLiteSchema,
    withSQLiteDatabase,
    retainSQLiteConnection,
    releaseSQLiteConnection,
} from './connection';

const deferred = () => {
    let resolve!: () => void;
    const promise = new Promise<void>(done => {
        resolve = done;
    });
    return { promise, resolve };
};
const database = () => {
    let opened = false;
    const methods = {
        open: vi.fn(async () => {
            opened = true;
        }),
        close: vi.fn(async () => {
            if (!opened) throw new Error('Database not opened');
            opened = false;
        }),
        execute: vi.fn(async () => undefined),
    };
    return { db: methods as unknown as SQLiteDBConnection, methods, isOpen: () => opened };
};

describe('shared SQLite connection ownership', () => {
    it('retains an encrypted connection across sequential operations until explicitly released', async () => {
        const { db, methods, isOpen } = database();
        retainSQLiteConnection(db);
        await withSQLiteDatabase(db, async () => undefined);
        await withSQLiteDatabase(db, async () => undefined);
        expect(methods.open).toHaveBeenCalledOnce();
        expect(methods.close).not.toHaveBeenCalled();
        expect(isOpen()).toBe(true);
        await releaseSQLiteConnection(db);
        expect(methods.close).toHaveBeenCalledOnce();
        expect(isOpen()).toBe(false);
    });

    it('waits for active operations before closing a released encrypted connection', async () => {
        const { db, methods } = database();
        const entered = deferred(),
            done = deferred();
        retainSQLiteConnection(db);
        const operation = withSQLiteDatabase(db, async () => {
            entered.resolve();
            await done.promise;
        });
        await entered.promise;
        await releaseSQLiteConnection(db);
        expect(methods.close).not.toHaveBeenCalled();
        done.resolve();
        await operation;
        expect(methods.close).toHaveBeenCalledOnce();
    });
    it('does not close a key read while a parallel cache write finishes', async () => {
        const { db, methods, isOpen } = database();
        const entered = deferred(),
            release = deferred();
        const read = withSQLiteDatabase(db, async () => {
            entered.resolve();
            await release.promise;
            expect(isOpen()).toBe(true);
            return 'stored-account-key';
        });
        await entered.promise;
        await withSQLiteDatabase(db, async () => {
            expect(isOpen()).toBe(true);
        });
        expect(methods.close).not.toHaveBeenCalled();
        release.resolve();
        expect(await read).toBe('stored-account-key');
        expect(methods.open).toHaveBeenCalledOnce();
        expect(methods.close).toHaveBeenCalledOnce();
    });

    it('allows nested SDK cache operations without deadlock', async () => {
        const { db, methods, isOpen } = database();
        await withSQLiteDatabase(db, async () => {
            await withSQLiteDatabase(db, async () => expect(isOpen()).toBe(true));
            expect(isOpen()).toBe(true);
        });
        expect(isOpen()).toBe(false);
        expect(methods.open).toHaveBeenCalledOnce();
        expect(methods.close).toHaveBeenCalledOnce();
    });

    it('waits for an in-flight close before reopening for another reader', async () => {
        const { db, methods } = database();
        const closing = deferred(),
            finish = deferred();
        methods.close.mockImplementationOnce(async () => {
            closing.resolve();
            await finish.promise;
        });
        const first = withSQLiteDatabase(db, async () => undefined);
        await closing.promise;
        const operation = vi.fn(async () => undefined);
        const second = withSQLiteDatabase(db, operation);
        await Promise.resolve();
        expect(operation).not.toHaveBeenCalled();
        finish.resolve();
        await Promise.all([first, second]);
        expect(methods.open).toHaveBeenCalledTimes(2);
        expect(operation).toHaveBeenCalledOnce();
    });

    it('releases failed operations and retries a rejected open', async () => {
        const { db, methods, isOpen } = database();
        methods.open.mockRejectedValueOnce(new Error('open failed'));
        await expect(withSQLiteDatabase(db, async () => undefined)).rejects.toThrow('open failed');
        await expect(
            withSQLiteDatabase(db, async () => {
                throw new Error('query failed');
            })
        ).rejects.toThrow('query failed');
        expect(isOpen()).toBe(false);
        expect(await withSQLiteDatabase(db, async () => 42)).toBe(42);
    });

    it('preserves the original operation error when cleanup also fails', async () => {
        const { db, methods } = database();
        methods.close.mockRejectedValueOnce(new Error('close failed'));
        await expect(
            withSQLiteDatabase(db, async () => {
                throw new Error('disk full');
            })
        ).rejects.toThrow('disk full');
        await expect(withSQLiteDatabase(db, async () => 'retry')).resolves.toBe('retry');
    });

    it('shares schema initialization and retries a failed schema without poisoning future reads', async () => {
        const { db, methods } = database();
        methods.execute.mockRejectedValueOnce(new Error('busy'));
        const sql = 'CREATE TABLE IF NOT EXISTS sample (id TEXT);';
        await expect(ensureSQLiteSchema(db, 'sample', sql)).rejects.toThrow('busy');
        await Promise.all(Array.from({ length: 20 }, () => ensureSQLiteSchema(db, 'sample', sql)));
        expect(methods.execute).toHaveBeenCalledTimes(2);
        expect(methods.execute).toHaveBeenLastCalledWith(sql);
        expect(methods.close).toHaveBeenCalledTimes(2);
    });
});
