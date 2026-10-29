// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
    setDb: vi.fn(),
    setSqlite: vi.fn(),
    ready: vi.fn(),
    encrypt: vi.fn(async () => undefined),
    driver: {
        isAvailable: true,
        checkConnectionsConsistency: vi.fn(),
        isConnection: vi.fn(),
        createConnection: vi.fn(),
    },
}));
vi.mock('learn-card-base/react-sqlite-hook', () => ({ useSQLite: () => mocks.driver }));
vi.mock('learn-card-base/SQL/nativeEncryption', () => ({ prepareNativeEncryption: mocks.encrypt }));
vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: () => 'android' } }));
vi.mock('learn-card-base', () => ({}));
vi.mock('../../stores/sqliteStore', () => ({
    sqliteStore: { set: { db: mocks.setDb, sqlite: mocks.setSqlite } },
}));
vi.mock('learn-card-base/SQL/sqliteReady', () => ({ markSQLiteReady: mocks.ready }));
vi.mock('../../logging/logger', () => ({ getLogger: () => ({ warn: vi.fn(), error: vi.fn() }) }));
import { sqliteInit } from '../useSQLiteStorage';
it('shares native initialization across mounted consumers with one connection and one schema pass', async () => {
    let opened = false;
    const db = {
        open: vi.fn(async () => {
            opened = true;
        }),
        close: vi.fn(async () => {
            expect(opened).toBe(true);
            opened = false;
        }),
        execute: vi.fn(async () => {
            expect(opened).toBe(true);
        }),
    };
    mocks.driver.checkConnectionsConsistency.mockResolvedValue({ result: false });
    mocks.driver.isConnection.mockResolvedValue({ result: false });
    mocks.driver.createConnection.mockResolvedValue(db);
    const first = renderHook(() => sqliteInit());
    const second = renderHook(() => sqliteInit());
    await waitFor(() => expect(second.result.current.existingConnection).toBe(true));
    expect(first.result.current.existingConnection).toBe(true);
    expect(mocks.driver.createConnection).toHaveBeenCalledOnce();
    expect(mocks.encrypt).toHaveBeenCalledOnce();
    expect(mocks.driver.createConnection).toHaveBeenCalledWith(
        'learncardDB',
        true,
        'secret',
        1,
        false
    );
    expect(db.open).toHaveBeenCalledOnce();
    expect(db.close).not.toHaveBeenCalled();
    expect(db.execute).toHaveBeenCalledTimes(8);
    expect(mocks.setSqlite).toHaveBeenLastCalledWith(mocks.driver);
    first.unmount();
    second.unmount();
    expect(opened).toBe(true);
});
