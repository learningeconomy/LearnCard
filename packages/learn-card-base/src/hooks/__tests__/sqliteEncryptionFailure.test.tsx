// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    setDb: vi.fn(),
    ready: vi.fn(),
    encrypt: vi.fn(async () => {
        throw new Error('Encrypted storage unavailable');
    }),
    create: vi.fn(),
}));
vi.mock('learn-card-base/react-sqlite-hook', () => ({
    useSQLite: () => ({ isAvailable: true, createConnection: mocks.create }),
}));
vi.mock('learn-card-base/SQL/nativeEncryption', () => ({ prepareNativeEncryption: mocks.encrypt }));
vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: () => 'ios' } }));
vi.mock('learn-card-base', () => ({}));
vi.mock('../../stores/sqliteStore', () => ({
    sqliteStore: { set: { db: mocks.setDb, sqlite: vi.fn() } },
}));
vi.mock('learn-card-base/SQL/sqliteReady', () => ({ markSQLiteReady: mocks.ready }));
vi.mock('../../logging/logger', () => ({ getLogger: () => ({ warn: vi.fn(), error: vi.fn() }) }));

import { sqliteInit } from '../useSQLiteStorage';

it('releases boot waiters without creating or publishing a plaintext connection after encryption failure', async () => {
    const hook = renderHook(() => sqliteInit());
    await waitFor(() => expect(mocks.ready).toHaveBeenCalledOnce());
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.setDb).not.toHaveBeenCalled();
    expect(hook.result.current.existingConnection).toBe(false);
    hook.unmount();
});
