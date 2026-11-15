// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    platform: 'android',
    setDb: vi.fn(),
    setSqlite: vi.fn(),
    ready: vi.fn(),
    entryDriver: undefined as unknown,
    hookDriver: undefined as unknown,
}));

vi.mock('learn-card-base/react-sqlite-hook', () => ({
    createSQLiteDriver: () => mocks.entryDriver,
    useSQLite: () => mocks.hookDriver,
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: () => mocks.platform } }));
vi.mock('learn-card-base', () => ({}));
vi.mock('../../stores/sqliteStore', () => ({
    sqliteStore: { set: { db: mocks.setDb, sqlite: mocks.setSqlite } },
}));
vi.mock('learn-card-base/SQL/sqliteReady', () => ({ markSQLiteReady: mocks.ready }));
vi.mock('../../logging/logger', () => ({ getLogger: () => ({ warn: vi.fn(), error: vi.fn() }) }));

const makeDb = () => ({
    open: vi.fn(async () => undefined),
    close: vi.fn(async () => undefined),
    execute: vi.fn(async () => undefined),
});

const makeDriver = (db: ReturnType<typeof makeDb>, fail = false) => ({
    isAvailable: true,
    checkConnectionsConsistency: vi.fn(async () => ({ result: false })),
    isConnection: vi.fn(async () => ({ result: false })),
    createConnection: vi.fn(async () => {
        if (fail) throw new Error('bridge unavailable');
        return db;
    }),
});

// The init promise is module state: load a fresh copy per test.
const load = async () => {
    vi.resetModules();
    return import('../useSQLiteStorage');
};

beforeEach(() => {
    mocks.platform = 'android';
    mocks.setDb.mockReset();
    mocks.setSqlite.mockReset();
    mocks.ready.mockReset();
});

it('starts native SQLite before React mounts and the app-shell hook joins that one connection', async () => {
    const db = makeDb();
    const entryDriver = makeDriver(db);
    const hookDriver = makeDriver(makeDb());
    mocks.entryDriver = entryDriver;
    mocks.hookDriver = hookDriver;
    const { startNativeSQLiteInit, sqliteInit } = await load();

    const attempt = startNativeSQLiteInit();
    expect(attempt).toBeDefined();
    await attempt;
    await waitFor(() => expect(mocks.ready).toHaveBeenCalledOnce());
    expect(mocks.setDb).toHaveBeenCalledWith(db);
    expect(mocks.setSqlite).toHaveBeenCalledWith(entryDriver);

    const hook = renderHook(() => sqliteInit());
    await waitFor(() => expect(hook.result.current.existingConnection).toBe(true));

    expect(entryDriver.createConnection).toHaveBeenCalledOnce();
    expect(hookDriver.createConnection).not.toHaveBeenCalled();
    expect(db.execute).toHaveBeenCalledTimes(8);
    expect(mocks.setDb).toHaveBeenCalledOnce();
    hook.unmount();
});

it('releases boot waiters when the entry attempt fails, and the app-shell mount retries', async () => {
    const hookDb = makeDb();
    const entryDriver = makeDriver(makeDb(), true);
    const hookDriver = makeDriver(hookDb);
    mocks.entryDriver = entryDriver;
    mocks.hookDriver = hookDriver;
    const { startNativeSQLiteInit, sqliteInit } = await load();

    await expect(startNativeSQLiteInit()).rejects.toThrow('bridge unavailable');
    await waitFor(() => expect(mocks.ready).toHaveBeenCalledOnce());
    expect(mocks.setDb).not.toHaveBeenCalled();

    const hook = renderHook(() => sqliteInit());
    await waitFor(() => expect(hook.result.current.existingConnection).toBe(true));
    expect(hookDriver.createConnection).toHaveBeenCalledOnce();
    expect(mocks.setDb).toHaveBeenCalledWith(hookDb);
    expect(mocks.setSqlite).toHaveBeenCalledWith(hookDriver);
    hook.unmount();
});

it('does nothing on web (the web store has its own initializer)', async () => {
    mocks.platform = 'web';
    const entryDriver = makeDriver(makeDb());
    mocks.entryDriver = entryDriver;
    const { startNativeSQLiteInit } = await load();

    expect(startNativeSQLiteInit()).toBeUndefined();
    expect(entryDriver.createConnection).not.toHaveBeenCalled();
    expect(mocks.ready).not.toHaveBeenCalled();
});
