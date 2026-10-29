// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
    platform: 'android',
    construct: vi.fn(),
    define: vi.fn(),
    nativeOwner: { closeAllConnections: vi.fn() },
    connection: {
        initWebStore: vi.fn(),
        checkConnectionsConsistency: vi.fn(),
        isConnection: vi.fn(),
        createConnection: vi.fn(),
        retrieveConnection: vi.fn(),
        closeAllConnections: vi.fn(),
    },
    setConnection: vi.fn(),
    setDb: vi.fn(),
    ready: vi.fn(),
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: () => mocks.platform } }));
vi.mock('@capacitor-community/sqlite', () => ({
    CapacitorSQLite: {},
    SQLiteConnection: class {
        constructor() {
            mocks.construct();
            return mocks.connection;
        }
    },
}));
vi.mock('jeep-sqlite/loader', () => ({ defineCustomElements: mocks.define }));
vi.mock('../stores/sqliteStore', () => ({
    sqliteStore: {
        get: { sqlite: () => mocks.nativeOwner },
        set: { sqlite: mocks.setConnection, db: mocks.setDb },
    },
}));
vi.mock('learn-card-base/SQL/sqliteReady', () => ({ markSQLiteReady: mocks.ready }));
vi.mock('../logging/logger', () => ({ getLogger: () => ({ warn: vi.fn(), error: vi.fn() }) }));
import { useSQLiteInitWeb } from './useSQLiteInitWeb';
beforeEach(() => {
    vi.clearAllMocks();
    mocks.platform = 'android';
    mocks.connection.initWebStore.mockResolvedValue(undefined);
    mocks.connection.checkConnectionsConsistency.mockResolvedValue({ result: false });
    mocks.connection.isConnection.mockResolvedValue({ result: false });
    mocks.connection.createConnection.mockResolvedValue({ database: 'web-only' });
    mocks.define.mockImplementation(() => {
        if (!customElements.get('jeep-sqlite'))
            customElements.define('jeep-sqlite', class extends HTMLElement {});
    });
});
afterEach(() => vi.restoreAllMocks());
describe('web SQLite initialization boundary', () => {
    it.each(['android', 'ios'])(
        'does not initialize or close account connections on %s',
        platform => {
            mocks.platform = platform;
            const hook = renderHook(() => useSQLiteInitWeb());
            window.dispatchEvent(new Event('DOMContentLoaded'));
            hook.unmount();
            expect(mocks.construct).not.toHaveBeenCalled();
            expect(mocks.define).not.toHaveBeenCalled();
            expect(mocks.nativeOwner.closeAllConnections).not.toHaveBeenCalled();
        }
    );
    it('loads the local web component when React mounts after DOMContentLoaded', async () => {
        mocks.platform = 'web';
        vi.spyOn(document, 'readyState', 'get').mockReturnValue('complete');
        const hook = renderHook(() => useSQLiteInitWeb());
        await waitFor(() => expect(mocks.setDb).toHaveBeenCalledWith({ database: 'web-only' }));
        expect(mocks.define).toHaveBeenCalledOnce();
        expect(mocks.connection.initWebStore).toHaveBeenCalledOnce();
        hook.unmount();
    });

    it('does not publish readiness after an abandoned mount, but a remount can initialize', async () => {
        mocks.platform = 'web';
        vi.spyOn(document, 'readyState', 'get').mockReturnValue('complete');
        let finish!: () => void;
        const pending = new Promise<void>(resolve => {
            finish = resolve;
        });
        mocks.connection.initWebStore.mockReturnValueOnce(pending);
        const abandoned = renderHook(() => useSQLiteInitWeb());
        await waitFor(() => expect(mocks.connection.initWebStore).toHaveBeenCalledOnce());
        abandoned.unmount();
        finish();
        await pending;
        expect(mocks.ready).not.toHaveBeenCalled();
        expect(mocks.setDb).not.toHaveBeenCalled();

        const replacement = renderHook(() => useSQLiteInitWeb());
        await waitFor(() => expect(mocks.setDb).toHaveBeenCalledOnce());
        expect(mocks.ready).toHaveBeenCalledOnce();
        replacement.unmount();
    });
});
