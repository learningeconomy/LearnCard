// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { createAuthCoordinator } from '../../auth-coordinator/AuthCoordinator';
import type { KeyDerivationStrategy } from '../../auth-coordinator/types';
import { atomicShareUpdate } from '../../../../sss-key-manager/src/atomic-operations';

const mocks = vi.hoisted(() => ({
    db: null as unknown,
    fallback: vi.fn(),
    encrypt: vi.fn(),
    create: vi.fn(),
    close: vi.fn(async () => undefined),
}));
vi.mock('@capacitor/core', () => ({
    Capacitor: { getPlatform: () => 'android', isNativePlatform: () => true },
}));
vi.mock('learn-card-base', () => ({}));
vi.mock('learn-card-base/react-sqlite-hook', () => ({
    useSQLite: () => ({
        isAvailable: true,
        checkConnectionsConsistency: async () => ({ result: false }),
        isConnection: async () => ({ result: false }),
        createConnection: mocks.create,
        closeConnection: mocks.close,
    }),
}));
vi.mock('learn-card-base/SQL/nativeEncryption', () => ({ prepareNativeEncryption: mocks.encrypt }));
vi.mock('learn-card-base/stores/sqliteStore', () => ({
    sqliteStore: {
        get: { db: () => mocks.db },
        use: { db: () => mocks.db },
        set: {
            db: (db: unknown) => {
                mocks.db = db;
            },
            sqlite: vi.fn(),
        },
    },
}));
vi.mock('learn-card-base/stores/currentUserStore', () => ({
    default: {
        get: { currentUser: () => ({ uid: 'synthetic' }) },
        set: { currentUserPK: mocks.fallback },
    },
}));
vi.mock('learn-card-base/security/webSecureStorage', () => ({}));
vi.mock('../../logging/logger', () => ({
    getLogger: () => ({ warn: vi.fn(), error: vi.fn() }),
}));

import { sqliteInit, useSQLiteStorage } from '../useSQLiteStorage';
import { waitForSQLiteReady, resetSQLiteReady } from '../../SQL/sqliteReady';
import {
    setPlatformPrivateKey,
    getPlatformPrivateKey,
} from '../../security/platformPrivateKeyStorage';
import { createNativeSSSStorage } from '../../security/nativeSSSStorage';

beforeEach(() => {
    vi.clearAllMocks();
    resetSQLiteReady();
    mocks.db = null;
});

it.each(['protected-secret', 'conversion', 'keyed-open', 'schema'])(
    '%s failure rejects account/recovery consumers without memory-only success or server rotation',
    async phase => {
        const failure = new Error('Synthetic storage failure');
        mocks.encrypt.mockImplementation(async () => {
            if (phase === 'protected-secret' || phase === 'conversion') throw failure;
            return 'encrypted';
        });
        mocks.create.mockResolvedValue({
            open: async () => {
                if (phase === 'keyed-open') throw failure;
            },
            execute: async () => {
                throw failure;
            },
            close: async () => undefined,
        });
        const settled = waitForSQLiteReady().then(
            () => 'ready',
            () => 'failed'
        );
        const hook = renderHook(() => sqliteInit());
        await waitFor(() => expect(mocks.encrypt).toHaveBeenCalledOnce());
        expect(await settled).toBe('failed');
        expect(mocks.db).toBeNull();
        await expect(waitForSQLiteReady()).rejects.toThrow();
        await expect(setPlatformPrivateKey('synthetic-key')).rejects.toThrow();
        await expect(getPlatformPrivateKey()).rejects.toThrow();
        await expect(useSQLiteStorage().setCurrentUser({ uid: 'synthetic' })).rejects.toThrow();
        expect(mocks.fallback).not.toHaveBeenCalled();
        const getCurrentUser = vi.fn();
        const cachedKey = vi.fn(async () => 'cached-memory-key');
        const coordinator = createAuthCoordinator({
            authProvider: {
                getCurrentUser,
                getIdToken: vi.fn(),
                getProviderType: () => 'firebase',
                signOut: vi.fn(),
            },
            keyDerivation: { capabilities: {} } as KeyDerivationStrategy,
            ensureStorageReady: waitForSQLiteReady,
            getCachedPrivateKey: cachedKey,
            didFromPrivateKey: async () => 'did:key:synthetic',
        });
        expect((await coordinator.initialize()).status).toBe('error');
        expect(cachedKey).not.toHaveBeenCalled();
        expect(getCurrentUser).not.toHaveBeenCalled();
        await expect(coordinator.recover({ method: 'phrase' })).rejects.toThrow();
        const storage = createNativeSSSStorage();
        await expect(storage.getDeviceShare()).rejects.toThrow();
        await expect(storage.storeDeviceShare('synthetic-share')).rejects.toThrow();
        await expect(storage.storeShareVersion(2)).rejects.toThrow();
        const storeAuth = vi.fn();
        await expect(
            atomicShareUpdate('01'.repeat(32), {
                storeDevice: share => storage.storeDeviceShare(share, 'pending'),
                storeAuth,
            })
        ).rejects.toMatchObject({ phase: 'store_device' });
        expect(storeAuth).not.toHaveBeenCalled();
        expect(hook.result.current.existingConnection).toBe(false);
        hook.unmount();
    }
);
