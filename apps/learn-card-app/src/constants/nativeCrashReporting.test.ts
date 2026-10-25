import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
    native: true,
    available: true,
    private: false,
    listener: undefined as (() => void) | undefined,
    configure: vi.fn(),
    current: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
    Capacitor: {
        isNativePlatform: () => state.native,
        isPluginAvailable: () => state.available,
    },
    registerPlugin: () => ({ configure: state.configure }),
}));
vi.mock('@capgo/capacitor-updater', () => ({ CapacitorUpdater: { current: state.current } }));
vi.mock('../components/share-links/sharePrivacy', () => ({
    isSharePrivateSession: () => state.private,
    subscribeSharePrivacy: (listener: () => void) => {
        state.listener = listener;
    },
}));

const load = () => import('./nativeCrashReporting');
const settle = async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
};

describe('native crash reporting privacy and runtime context', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        vi.stubGlobal('__PACKAGE_VERSION__', '1.100.5');
        vi.stubGlobal('__BUILD_SHA__', 'abc1234');
        state.native = true;
        state.available = true;
        state.private = false;
        state.listener = undefined;
        state.configure.mockResolvedValue({ enabled: true });
        state.current.mockResolvedValue({ bundle: { version: '1.100.5-staging.abc1234' } });
    });

    it('reads the native persisted gate without enabling it during bootstrap', async () => {
        state.configure.mockResolvedValue({ enabled: false });
        const reporter = await load();
        await reporter.initializeNativeCrashReporting();
        await settle();
        expect(state.configure).toHaveBeenCalledWith({
            privateSession: false,
            tags: { web_version: '1.100.5', web_sha: 'abc1234' },
        });
        expect(state.configure.mock.calls.every(([options]) => options.enabled === undefined)).toBe(
            true
        );
        expect(reporter.canSendCrashReport()).toBe(false);
    });

    it('reports OTA identity separately from the web build', async () => {
        const reporter = await load();
        await reporter.initializeNativeCrashReporting();
        await settle();
        expect(state.configure).toHaveBeenCalledWith({
            privateSession: false,
            tags: { ota_bundle: '1.100.5-staging.abc1234' },
        });
    });

    it('blocks immediately on opt-out and persists it through the native bridge', async () => {
        const reporter = await load();
        reporter.setCrashReportingEnabled(false);
        expect(reporter.canSendCrashReport()).toBe(false);
        state.configure.mockResolvedValue({ enabled: false });
        await settle();
        expect(state.configure).toHaveBeenCalledWith({ enabled: false, privateSession: false });
    });

    it('does not let a late bootstrap response undo an opt-out', async () => {
        let resolve!: (value: { enabled: boolean }) => void;
        state.configure.mockImplementationOnce(
            () =>
                new Promise(done => {
                    resolve = done;
                })
        );
        const reporter = await load();
        const initializing = reporter.initializeNativeCrashReporting();
        await Promise.resolve();
        reporter.setCrashReportingEnabled(false);
        state.configure.mockImplementation(() => new Promise(() => {}));
        resolve({ enabled: true });
        await initializing;
        expect(reporter.canSendCrashReport()).toBe(false);
    });

    it('blocks and notifies native code when entering a private share viewer', async () => {
        const reporter = await load();
        await reporter.initializeNativeCrashReporting();
        state.private = true;
        state.listener?.();
        expect(reporter.canSendCrashReport()).toBe(false);
        await settle();
        expect(state.configure).toHaveBeenLastCalledWith({ privateSession: true });
    });

    it('only forwards route families, never credential IDs, tokens, or queries', async () => {
        const reporter = await load();
        reporter.updateCrashReportingRoute('/credentials/private-id?token=secret#key');
        reporter.updateCrashReportingRoute('/learninghistory/private-id');
        await settle();
        expect(state.configure.mock.calls.map(([options]) => options.tags)).toEqual([
            { route_group: 'other' },
            { route_group: 'learninghistory' },
        ]);
    });

    it('fails closed if the native preference cannot be read', async () => {
        state.configure.mockRejectedValue(new Error('bridge failure'));
        const reporter = await load();
        await reporter.initializeNativeCrashReporting();
        expect(reporter.canSendCrashReport()).toBe(false);
    });

    it.each([
        { native: false, available: false },
        { native: true, available: false },
    ])('preserves JS reporting on web or an older native binary (%j)', async platform => {
        Object.assign(state, platform);
        const reporter = await load();
        await reporter.initializeNativeCrashReporting();
        expect(state.configure).not.toHaveBeenCalled();
        expect(reporter.canSendCrashReport()).toBe(true);
    });
});
