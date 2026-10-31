// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    setDb: vi.fn(),
    ready: vi.fn(),
    create: vi.fn(),
    close: vi.fn(),
}));
vi.mock('learn-card-base/SQL/nativeEncryption', () => ({
    prepareNativeEncryption: async () => 'encrypted',
}));
vi.mock('learn-card-base/react-sqlite-hook', () => ({
    useSQLite: () => ({
        isAvailable: true,
        checkConnectionsConsistency: async () => ({ result: false }),
        isConnection: async () => ({ result: false }),
        createConnection: mocks.create,
        closeConnection: mocks.close,
    }),
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: () => 'ios' } }));
vi.mock('learn-card-base', () => ({}));
vi.mock('../../stores/sqliteStore', () => ({
    sqliteStore: { set: { db: mocks.setDb, sqlite: vi.fn() } },
}));
vi.mock('learn-card-base/SQL/sqliteReady', () => ({ markSQLiteReady: mocks.ready }));
vi.mock('../../logging/logger', () => ({ getLogger: () => ({ warn: vi.fn(), error: vi.fn() }) }));

import { sqliteInit } from '../useSQLiteStorage';

it('never retries an encrypted-open failure as plaintext or publishes an unusable handle', async () => {
    const db = {
        open: vi.fn().mockRejectedValue(new Error('Synthetic wrong key')),
        close: vi.fn(),
        execute: vi.fn(),
    };
    mocks.create.mockResolvedValue(db);
    mocks.close.mockResolvedValue(undefined);
    const hook = renderHook(() => sqliteInit());
    await waitFor(() => expect(mocks.ready).toHaveBeenCalledOnce());
    expect(mocks.create).toHaveBeenCalledOnce();
    expect(mocks.create).toHaveBeenCalledWith('learncardDB', true, 'secret', 1, false);
    expect(mocks.close).toHaveBeenCalledWith('learncardDB', false);
    expect(mocks.setDb).not.toHaveBeenCalled();
    expect(hook.result.current.existingConnection).toBe(false);
    hook.unmount();
});
