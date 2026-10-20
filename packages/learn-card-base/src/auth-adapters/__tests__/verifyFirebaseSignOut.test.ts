import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Auth } from 'firebase/auth';
import { verifyFirebaseSignOut } from '../verifyFirebaseSignOut';

const logs = vi.hoisted(() => ({ info: vi.fn(), warn: vi.fn() }));
vi.mock('../../logging/logger', () => ({ getLogger: () => logs }));

const createStorage = () => {
    const count = { result: 0, onsuccess: () => {}, onerror: () => {} };
    const store = { count: vi.fn(() => count) };
    const transaction = {
        objectStore: vi.fn(() => store),
        abort: vi.fn(),
        onabort: () => {},
        onerror: () => {},
    };
    const database = {
        close: vi.fn(),
        objectStoreNames: { contains: vi.fn(() => true) },
        transaction: vi.fn(() => transaction),
        onversionchange: () => {},
    };
    const request = {
        result: database,
        transaction,
        onsuccess: () => {},
        onerror: () => {},
        onupgradeneeded: () => {},
    };
    const indexedDB = { open: vi.fn(() => request) };
    vi.stubGlobal('indexedDB', indexedDB);
    return { count, store, transaction, database, request, indexedDB };
};

describe('Firebase sign-out persistence verification', () => {
    let auth: Auth;
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        auth = {
            app: { name: 'private-app', options: { apiKey: 'private-api-key' } },
            currentUser: null,
        } as unknown as Auth;
    });
    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it.each([0, 1])(
        'checks only this Firebase app without loading values (count: %s)',
        async remaining => {
            const storage = createStorage();
            const check = verifyFirebaseSignOut(auth);
            storage.request.onsuccess();
            expect(storage.database.transaction).toHaveBeenCalledWith(
                'firebaseLocalStorage',
                'readonly'
            );
            expect(storage.store.count).toHaveBeenCalledExactlyOnceWith(
                'firebase:authUser:private-api-key:private-app'
            );
            storage.count.result = remaining;
            storage.count.onsuccess();
            await check;
            if (remaining) {
                expect(logs.warn).toHaveBeenCalledWith(
                    'Firebase persisted sign-in remains after sign-out',
                    { liveAuthUserPresent: false }
                );
            } else {
                expect(logs.info).toHaveBeenCalledWith(
                    'Firebase persisted sign-in cleared after sign-out'
                );
                expect(logs.warn).not.toHaveBeenCalled();
            }
            expect(storage.database.close).toHaveBeenCalledOnce();
            expect(vi.getTimerCount()).toBe(0);
            expect(
                JSON.stringify([...logs.warn.mock.calls, ...logs.info.mock.calls])
            ).not.toContain('private-');
        }
    );

    it('does not mistake a new sign-in for failed logout', async () => {
        const storage = createStorage();
        const check = verifyFirebaseSignOut(auth);
        storage.request.onsuccess();
        (auth as { currentUser: unknown }).currentUser = { uid: 'new-user' };
        storage.count.result = 1;
        storage.count.onsuccess();
        await check;
        expect(logs.warn).not.toHaveBeenCalled();
        expect(logs.info).toHaveBeenCalledWith(
            'Firebase sign-out persistence check skipped for a new sign-in'
        );
    });

    it('aborts creation when the Firebase database does not exist', async () => {
        const storage = createStorage();
        const check = verifyFirebaseSignOut(auth);
        storage.request.onupgradeneeded();
        storage.request.onerror();
        await check;
        expect(storage.transaction.abort).toHaveBeenCalledOnce();
        expect(storage.store.count).not.toHaveBeenCalled();
    });

    it('bounds a blocked open and closes a connection that arrives after the deadline', async () => {
        const storage = createStorage();
        const check = verifyFirebaseSignOut(auth);
        await vi.advanceTimersByTimeAsync(1_000);
        await check;
        expect(logs.warn).toHaveBeenCalledExactlyOnceWith(
            'Firebase sign-out persistence check incomplete',
            { outcome: 'timeout' }
        );
        storage.request.onsuccess();
        expect(storage.database.close).toHaveBeenCalledOnce();
        expect(storage.store.count).not.toHaveBeenCalled();
    });

    it('bounds an unresponsive read, aborts it, and ignores late results', async () => {
        const storage = createStorage();
        const check = verifyFirebaseSignOut(auth);
        storage.request.onsuccess();
        await vi.advanceTimersByTimeAsync(1_000);
        await check;
        expect(storage.transaction.abort).toHaveBeenCalledOnce();
        expect(storage.database.close).toHaveBeenCalledOnce();
        storage.count.result = 1;
        storage.count.onsuccess();
        expect(logs.warn).toHaveBeenCalledTimes(1);
    });

    it.each(['open', 'schema', 'read'] as const)(
        'does not fail logout when %s is unavailable',
        async phase => {
            const storage = createStorage();
            if (phase === 'open')
                storage.indexedDB.open.mockImplementation(() => {
                    throw new Error('private error');
                });
            if (phase === 'schema')
                storage.database.objectStoreNames.contains.mockReturnValue(false);
            const check = verifyFirebaseSignOut(auth);
            if (phase !== 'open') storage.request.onsuccess();
            if (phase === 'read') storage.count.onerror();
            await expect(check).resolves.toBeUndefined();
            expect(logs.warn).toHaveBeenCalledExactlyOnceWith(
                'Firebase sign-out persistence check incomplete',
                { outcome: 'unavailable' }
            );
            expect(vi.getTimerCount()).toBe(0);
        }
    );
});
