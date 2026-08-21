// @vitest-environment jsdom

import { beforeEach, afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

/**
 * Automatic listener tests (LC-2086 Task 10).
 *
 * `useAutomaticFeedbackTriggers` mounts the shake and iOS screenshot
 * observers. Capacitor platform/app state, the local shake plugin, the local
 * `ScreenshotObserver` bridge, LaunchDarkly flags, the clock, and the central
 * logger are all stubbed so registration decisions, foreground gating, the
 * ten-second cooldown, and handle cleanup are observable in isolation.
 */

const capacitorState = vi.hoisted(() => ({
    isNative: true,
    platform: 'ios' as string,
}));

const flags = vi.hoisted(() => ({
    value: {} as Record<string, unknown>,
}));

const appHost = vi.hoisted(() => ({
    getState: vi.fn(),
    addListener: vi.fn(),
}));

const shakeHost = vi.hoisted(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    addListener: vi.fn(),
}));

const screenshotHost = vi.hoisted(() => ({
    addListener: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
    Capacitor: {
        isNativePlatform: () => capacitorState.isNative,
        getPlatform: () => capacitorState.platform,
    },
    registerPlugin: vi.fn(() => undefined),
}));

vi.mock('@capacitor/app', () => ({
    App: {
        getState: appHost.getState,
        addListener: appHost.addListener,
    },
}));

vi.mock('./native/ShakeObserver', () => ({
    SHAKE_OBSERVER_OPTIONS: { threshold: 2.7, cooldownMs: 2_000 },
    ShakeObserver: {
        start: shakeHost.start,
        stop: shakeHost.stop,
        addListener: shakeHost.addListener,
    },
}));

vi.mock('./native/ScreenshotObserver', () => ({
    ScreenshotObserver: {
        addListener: screenshotHost.addListener,
    },
}));

vi.mock('launchdarkly-react-client-sdk', () => ({
    useFlags: () => flags.value,
}));

// The learn-card-base barrel pulls the web3auth stack and cannot load under
// jsdom; stub the exact surface the hook consumes.
vi.mock('learn-card-base', () => ({
    getLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

import { useAutomaticFeedbackTriggers } from './useAutomaticFeedbackTriggers';

interface ListenerHandle {
    remove: Mock;
}

const createHandle = (): ListenerHandle => ({ remove: vi.fn(async () => undefined) });

/** Captured native callbacks, populated by the mocked addListener fns. */
let shakeCallback: (() => void) | undefined;
let screenshotCallback: ((event: { capturedAt: string }) => void) | undefined;
let appStateCallback: ((state: { isActive: boolean }) => void) | undefined;

const reportProblem = vi.fn(async () => undefined);

/** Let registration promises resolve and their handles settle. */
const flush = async (): Promise<void> => {
    await act(async () => {
        await Promise.resolve();
    });
};

describe('useAutomaticFeedbackTriggers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        capacitorState.isNative = true;
        capacitorState.platform = 'ios';
        flags.value = { shakeToReportEnabled: true };
        appHost.getState.mockResolvedValue({ isActive: true });
        shakeHost.start.mockResolvedValue(undefined);
        shakeHost.stop.mockResolvedValue(undefined);
        appHost.addListener.mockImplementation(async (_event: string, cb: (s: never) => void) => {
            appStateCallback = cb as typeof appStateCallback;
            return createHandle();
        });
        shakeHost.addListener.mockImplementation(async (_event: string, cb: () => void) => {
            shakeCallback = cb;
            return createHandle();
        });
        screenshotHost.addListener.mockImplementation(
            async (_event: string, cb: (e: never) => void) => {
                screenshotCallback = cb as typeof screenshotCallback;
                return createHandle();
            }
        );
        shakeCallback = undefined;
        screenshotCallback = undefined;
        appStateCallback = undefined;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const mount = (enabled = true) =>
        renderHook(
            ({ hookEnabled }) =>
                useAutomaticFeedbackTriggers({ enabled: hookEnabled, reportProblem }),
            { initialProps: { hookEnabled: enabled } }
        );

    it('registers no listeners on web', async () => {
        capacitorState.isNative = false;

        const { unmount } = mount();
        await flush();
        unmount();

        expect(appHost.addListener).not.toHaveBeenCalled();
        expect(shakeHost.start).not.toHaveBeenCalled();
        expect(shakeHost.stop).not.toHaveBeenCalled();
        expect(shakeHost.addListener).not.toHaveBeenCalled();
        expect(screenshotHost.addListener).not.toHaveBeenCalled();
    });

    it('registers no shake listener when shakeToReportEnabled is missing', async () => {
        flags.value = {};

        const { unmount } = mount();
        await flush();
        unmount();

        expect(shakeHost.addListener).not.toHaveBeenCalled();
        expect(shakeHost.start).not.toHaveBeenCalled();
    });

    it('registers no shake listener when shakeToReportEnabled is false', async () => {
        flags.value = { shakeToReportEnabled: false };

        const { unmount } = mount();
        await flush();
        unmount();

        expect(shakeHost.addListener).not.toHaveBeenCalled();
        expect(shakeHost.start).not.toHaveBeenCalled();
    });

    it('registers no listeners when bug eligibility is false', async () => {
        const { unmount } = mount(false);
        await flush();
        unmount();

        expect(appHost.addListener).not.toHaveBeenCalled();
        expect(shakeHost.start).not.toHaveBeenCalled();
        expect(shakeHost.stop).not.toHaveBeenCalled();
        expect(shakeHost.addListener).not.toHaveBeenCalled();
        expect(screenshotHost.addListener).not.toHaveBeenCalled();
    });

    it('starts native sensing with conservative physical-tuning options', async () => {
        const { unmount } = mount();
        await flush();

        expect(shakeHost.start).toHaveBeenCalledTimes(1);
        expect(shakeHost.start).toHaveBeenCalledWith({ threshold: 2.7, cooldownMs: 2_000 });

        unmount();
    });

    it('does not start native sensing while the initial app state is backgrounded', async () => {
        appHost.getState.mockResolvedValue({ isActive: false });

        const { unmount } = mount();
        await flush();

        expect(shakeHost.start).not.toHaveBeenCalled();

        unmount();
    });

    it('stops native sensing when the shake flag turns off without disturbing screenshots', async () => {
        const { rerender, unmount } = mount();
        await flush();

        const screenshotHandle = await screenshotHost.addListener.mock.results[0].value;
        expect(shakeHost.start).toHaveBeenCalledTimes(1);

        flags.value = { shakeToReportEnabled: false };
        rerender({ hookEnabled: true });
        await flush();

        expect(shakeHost.stop).toHaveBeenCalledTimes(1);
        expect(screenshotHost.addListener).toHaveBeenCalledTimes(1);
        expect(screenshotHandle.remove).not.toHaveBeenCalled();

        screenshotCallback!({ capturedAt: '2026-08-21T00:00:00.000Z' });
        expect(reportProblem).toHaveBeenCalledWith({ source: 'screenshot' });

        unmount();
    });

    it('stops native sensing when bug eligibility is lost', async () => {
        const { rerender, unmount } = mount();
        await flush();

        expect(shakeHost.start).toHaveBeenCalledTimes(1);

        rerender({ hookEnabled: false });
        await flush();

        expect(shakeHost.stop).toHaveBeenCalledTimes(1);

        unmount();
    });

    it('calls reportProblem({ source: "shake" }) once inside ten seconds', async () => {
        const now = vi.spyOn(Date, 'now');
        now.mockReturnValue(10_000);

        const { unmount } = mount();
        await flush();

        expect(appHost.getState).toHaveBeenCalledTimes(1);
        expect(appHost.addListener).toHaveBeenCalledWith('appStateChange', expect.any(Function));
        expect(shakeHost.addListener).toHaveBeenCalledWith('shake', expect.any(Function));
        expect(shakeHost.start).toHaveBeenCalledTimes(1);

        shakeCallback!();
        expect(reportProblem).toHaveBeenCalledWith({ source: 'shake' });

        // Exactly one accepted shake inside the 10s cooldown window…
        now.mockReturnValue(19_999);
        shakeCallback!();
        expect(reportProblem).toHaveBeenCalledTimes(1);

        // …and the boundary at exactly +10s accepts the next shake.
        now.mockReturnValue(20_000);
        shakeCallback!();
        expect(reportProblem).toHaveBeenCalledTimes(2);
        expect(reportProblem).toHaveBeenNthCalledWith(2, { source: 'shake' });

        unmount();
    });

    it('ignores shakes while the app is backgrounded', async () => {
        const { unmount } = mount();
        await flush();

        act(() => {
            appStateCallback!({ isActive: false });
        });
        await flush();
        expect(shakeHost.stop).toHaveBeenCalledTimes(1);

        shakeCallback!();
        expect(reportProblem).not.toHaveBeenCalled();

        act(() => {
            appStateCallback!({ isActive: true });
        });
        await flush();
        expect(shakeHost.start).toHaveBeenCalledTimes(2);

        shakeCallback!();
        expect(reportProblem).toHaveBeenCalledWith({ source: 'shake' });

        unmount();
    });

    it('ignores shakes until an app-state change confirms the foreground', async () => {
        // Initial state lookup fails — foreground stays fail-closed until the
        // next appStateChange event, but listeners still register.
        appHost.getState.mockRejectedValue(new Error('unavailable'));

        const { unmount } = mount();
        await flush();

        expect(shakeHost.start).not.toHaveBeenCalled();
        shakeCallback!();
        expect(reportProblem).not.toHaveBeenCalled();

        act(() => {
            appStateCallback!({ isActive: true });
        });
        await flush();
        expect(shakeHost.start).toHaveBeenCalledTimes(1);

        shakeCallback!();
        expect(reportProblem).toHaveBeenCalledWith({ source: 'shake' });

        unmount();
    });

    it('calls reportProblem({ source: "screenshot" }) on iOS screenshot', async () => {
        const { unmount } = mount();
        await flush();

        expect(screenshotHost.addListener).toHaveBeenCalledWith(
            'screenshotTaken',
            expect.any(Function)
        );

        screenshotCallback!({ capturedAt: '2026-08-21T00:00:00.000Z' });
        expect(reportProblem).toHaveBeenCalledWith({ source: 'screenshot' });

        unmount();
    });

    it('does not register the iOS screenshot listener on Android', async () => {
        capacitorState.platform = 'android';

        const { unmount } = mount();
        await flush();
        unmount();

        expect(screenshotHost.addListener).not.toHaveBeenCalled();
        expect(shakeHost.addListener).toHaveBeenCalledWith('shake', expect.any(Function));
        expect(shakeHost.start).toHaveBeenCalledWith({ threshold: 2.7, cooldownMs: 2_000 });
        expect(appHost.addListener).toHaveBeenCalledWith('appStateChange', expect.any(Function));
    });

    it('removes every registered listener handle on cleanup', async () => {
        const { unmount } = mount();
        await flush();

        const handles: ListenerHandle[] = [
            appHost.addListener.mock.results[0].value,
            shakeHost.addListener.mock.results[0].value,
            screenshotHost.addListener.mock.results[0].value,
        ] as unknown as ListenerHandle[];
        const registered = await Promise.all(handles);

        unmount();
        await flush();

        expect(shakeHost.stop).toHaveBeenCalledTimes(1);
        for (const handle of registered) {
            expect(handle.remove).toHaveBeenCalledTimes(1);
        }
    });

    it('removes handles that resolve after cleanup', async () => {
        let resolveRegistration: ((handle: ListenerHandle) => void) | undefined;
        shakeHost.addListener.mockImplementation(
            (_event: string, cb: () => void) =>
                new Promise(resolve => {
                    shakeCallback = cb;
                    resolveRegistration = resolve;
                })
        );

        const { unmount } = mount();
        await flush();
        unmount();

        const lateHandle = createHandle();
        await act(async () => {
            resolveRegistration?.(lateHandle);
        });

        expect(lateHandle.remove).toHaveBeenCalledTimes(1);
    });

    it('re-registers listeners when the shake flag turns on', async () => {
        flags.value = {};

        const { rerender, unmount } = mount();
        await flush();
        expect(shakeHost.addListener).not.toHaveBeenCalled();

        flags.value = { shakeToReportEnabled: true };
        rerender({ hookEnabled: true });
        await flush();

        await waitFor(() => {
            expect(shakeHost.addListener).toHaveBeenCalledWith('shake', expect.any(Function));
            expect(shakeHost.start).toHaveBeenCalledWith({ threshold: 2.7, cooldownMs: 2_000 });
        });

        unmount();
    });
});
