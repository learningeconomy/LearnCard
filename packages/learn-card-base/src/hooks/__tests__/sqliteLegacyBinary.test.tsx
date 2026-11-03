// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    prepare: vi.fn(),
    setDb: vi.fn(),
    ready: vi.fn(),
    create: vi.fn(),
}));
vi.mock('@capacitor-community/sqlite', () => ({
    CapacitorSQLite: { prepareEncryptedDatabase: mocks.prepare },
}));
vi.mock('learn-card-base/react-sqlite-hook', () => ({
    useSQLite: () => ({
        isAvailable: true,
        checkConnectionsConsistency: async () => ({ result: false }),
        isConnection: async () => ({ result: false }),
        createConnection: mocks.create,
    }),
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: () => 'android' } }));
vi.mock('learn-card-base', () => ({}));
vi.mock('../../stores/sqliteStore', () => ({
    sqliteStore: { set: { db: mocks.setDb, sqlite: vi.fn() } },
}));
vi.mock('learn-card-base/SQL/sqliteReady', () => ({ markSQLiteReady: mocks.ready }));
vi.mock('../../logging/logger', () => ({ getLogger: () => ({ warn: vi.fn(), error: vi.fn() }) }));

import { sqliteInit } from '../useSQLiteStorage';

it('opens legacy storage when the older native binary has no encryption preparation method', async () => {
    mocks.prepare.mockRejectedValue({ code: 'UNIMPLEMENTED' });
    const db = { open: vi.fn(), close: vi.fn(), execute: vi.fn() };
    mocks.create.mockResolvedValue(db);
    const hook = renderHook(() => sqliteInit());
    await waitFor(() => expect(hook.result.current.existingConnection).toBe(true));
    expect(mocks.prepare).toHaveBeenCalledOnce();
    expect(mocks.create).toHaveBeenCalledWith('learncardDB', false, 'no-encryption', 1, false);
    expect(db.open).toHaveBeenCalledOnce();
    expect(mocks.setDb).toHaveBeenCalledWith(db);
    expect(mocks.ready).toHaveBeenCalledOnce();
    hook.unmount();
});
