import { beforeEach, expect, it } from 'vitest';
import {
    markSQLiteFailed,
    markSQLiteReady,
    resetSQLiteReady,
    waitForSQLiteReady,
} from './sqliteReady';

beforeEach(resetSQLiteReady);
it('rejects existing and later waiters after failure, and allows a successful initialization retry', async () => {
    const pending = waitForSQLiteReady();
    markSQLiteFailed();
    await expect(pending).rejects.toThrow('Account storage');
    await expect(waitForSQLiteReady()).rejects.toThrow('Account storage');
    markSQLiteReady();
    await expect(waitForSQLiteReady()).resolves.toBeUndefined();
});
it('supports normal successful web/native initialization', async () => {
    const pending = waitForSQLiteReady();
    markSQLiteReady();
    await expect(pending).resolves.toBeUndefined();
});
