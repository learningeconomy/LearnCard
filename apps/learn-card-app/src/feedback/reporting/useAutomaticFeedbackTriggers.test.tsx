// @vitest-environment jsdom

import { beforeEach, afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';

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

const loggerHost = vi.hoisted(() => ({
    warn: vi.fn(),
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
    getLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: loggerHost.warn, error: vi.fn() }),
}));

import { useAutomaticFeedbackTriggers } from './useAutomaticFeedbackTriggers';

interface ListenerHandle {
    remove: Mock;
}

const createHandle = (): ListenerHandle => ({ remove: vi.fn(async () => undefined) });

const createDeferred = (): {
    promise: Promise<void>;
    resolve: () => void;
} => {
    let resolvePromise: (() => void) | undefined;
    const promise = new Promise<void>(resolve => {
        resolvePromise = resolve;
    });

    return { promise, resolve: () => resolvePromise?.() };
};

const createRegistrationDeferred = (): {
    promise: Promise<ListenerHandle>;
    resolve: (handle: ListenerHandle) => void;
    reject: (reason?: unknown) => void;
} => {
    let resolvePromise!: (handle: ListenerHandle) => void;
    let rejectPromise!: (reason?: unknown) => void;
    const promise = new Promise<ListenerHandle>((resolve, reject) => {
        resolvePromise = resolve;
        rejectPromise = reject;
    });

    return { promise, resolve: resolvePromise, reject: rejectPromise };
};

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

    afterEach(async () => {
        cleanup();
        await act(async () => {
            if (vi.isFakeTimers()) await vi.runAllTimersAsync();
            await Promise.resolve();
        });
        vi.useRealTimers();
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

    it('never starts shake sensing when app-state listener registration rejects', async () => {
        appHost.addListener.mockRejectedValueOnce(new Error('listener unavailable'));

        const { unmount } = mount();
        await flush();
        await flush();

        expect(shakeHost.start).not.toHaveBeenCalled();
        shakeCallback!();
        expect(reportProblem).not.toHaveBeenCalledWith({ source: 'shake' });

        expect(screenshotHost.addListener).toHaveBeenCalledTimes(1);
        screenshotCallback!({ capturedAt: '2026-08-21T00:00:00.000Z' });
        expect(reportProblem).toHaveBeenCalledWith({ source: 'screenshot' });

        unmount();
    });

    it('ignores a stale app-state registration rejection after a new effect owns sensing', async () => {
        const oldRegistration = createRegistrationDeferred();
        appHost.addListener
            .mockImplementationOnce((_event: string, cb: (s: never) => void) => {
                appStateCallback = cb as typeof appStateCallback;
                return oldRegistration.promise;
            })
            .mockImplementationOnce(
                async (_event: string, cb: (s: never) => void): Promise<ListenerHandle> => {
                    appStateCallback = cb as typeof appStateCallback;
                    return createHandle();
                }
            );

        const { rerender, unmount } = mount();
        await flush();
        expect(shakeHost.start).not.toHaveBeenCalled();

        flags.value = { shakeToReportEnabled: false };
        rerender({ hookEnabled: true });
        await flush();

        flags.value = { shakeToReportEnabled: true };
        rerender({ hookEnabled: true });
        await flush();

        expect(shakeHost.start).toHaveBeenCalledTimes(1);
        const stopCallsBeforeStaleRejection = shakeHost.stop.mock.calls.length;

        await act(async () => {
            oldRegistration.reject(new Error('old listener unavailable'));
            await Promise.resolve();
        });
        await flush();

        expect(shakeHost.stop).toHaveBeenCalledTimes(stopCallsBeforeStaleRejection);
        shakeCallback!();
        expect(reportProblem).toHaveBeenCalledWith({ source: 'shake' });

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

    it('ignores an old app-state callback after its effect has been disposed', async () => {
        let nativeSensing = false;
        shakeHost.start.mockImplementation(async () => {
            nativeSensing = true;
        });
        shakeHost.stop.mockImplementation(async () => {
            nativeSensing = false;
        });

        const { rerender, unmount } = mount();
        await flush();

        const disposedAppStateCallback = appStateCallback!;
        expect(nativeSensing).toBe(true);

        flags.value = { shakeToReportEnabled: false };
        rerender({ hookEnabled: true });
        await flush();

        expect(nativeSensing).toBe(false);
        const startCallsAfterCleanup = shakeHost.start.mock.calls.length;

        act(() => {
            disposedAppStateCallback({ isActive: true });
        });
        await flush();

        expect(shakeHost.start).toHaveBeenCalledTimes(startCallsAfterCleanup);
        expect(nativeSensing).toBe(false);

        unmount();
    });

    it('converges to the latest started state across a deferred start and rapid effect reruns', async () => {
        const firstStart = createDeferred();
        const completedOperations: Array<'start' | 'stop'> = [];
        let nativeSensing = false;

        shakeHost.start
            .mockImplementationOnce(async () => {
                await firstStart.promise;
                nativeSensing = true;
                completedOperations.push('start');
            })
            .mockImplementation(async () => {
                nativeSensing = true;
                completedOperations.push('start');
            });
        shakeHost.stop.mockImplementation(async () => {
            nativeSensing = false;
            completedOperations.push('stop');
        });

        const { rerender, unmount } = mount();
        await flush();
        expect(shakeHost.start).toHaveBeenCalledTimes(1);

        flags.value = { shakeToReportEnabled: false };
        rerender({ hookEnabled: true });
        flags.value = { shakeToReportEnabled: true };
        rerender({ hookEnabled: true });
        await flush();

        await act(async () => {
            firstStart.resolve();
            await Promise.resolve();
        });
        await flush();
        await flush();

        expect(nativeSensing).toBe(true);
        expect(completedOperations.at(-1)).toBe('start');

        unmount();
    });

    it('converges to stopped when unmounted during a deferred start', async () => {
        const firstStart = createDeferred();
        let nativeSensing = false;

        shakeHost.start.mockImplementationOnce(async () => {
            await firstStart.promise;
            nativeSensing = true;
        });
        shakeHost.stop.mockImplementation(async () => {
            nativeSensing = false;
        });

        const { unmount } = mount();
        await flush();
        expect(shakeHost.start).toHaveBeenCalledTimes(1);

        unmount();
        expect(shakeHost.stop).not.toHaveBeenCalled();

        await act(async () => {
            firstStart.resolve();
            await Promise.resolve();
        });
        await flush();

        expect(shakeHost.stop).toHaveBeenCalledTimes(1);
        expect(nativeSensing).toBe(false);
    });

    it('retries a rejected start and converges to started while still desired', async () => {
        vi.useFakeTimers();
        let nativeSensing = false;
        shakeHost.start
            .mockRejectedValueOnce(new Error('start failed'))
            .mockImplementation(async () => {
                nativeSensing = true;
            });

        const { unmount } = mount();
        await flush();

        expect(shakeHost.start).toHaveBeenCalledTimes(1);
        expect(nativeSensing).toBe(false);
        expect(vi.getTimerCount()).toBe(1);

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(shakeHost.start).toHaveBeenCalledTimes(2);
        expect(nativeSensing).toBe(true);
        expect(vi.getTimerCount()).toBe(0);

        unmount();
        await flush();
    });

    it('retries a rejected stop after unmount and converges to stopped', async () => {
        vi.useFakeTimers();
        let nativeSensing = false;
        shakeHost.start.mockImplementation(async () => {
            nativeSensing = true;
        });
        shakeHost.stop
            .mockRejectedValueOnce(new Error('stop failed'))
            .mockImplementation(async () => {
                nativeSensing = false;
            });

        const { unmount } = mount();
        await flush();
        expect(nativeSensing).toBe(true);

        unmount();
        await flush();

        expect(shakeHost.stop).toHaveBeenCalledTimes(1);
        expect(nativeSensing).toBe(true);
        expect(vi.getTimerCount()).toBe(1);

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(shakeHost.stop).toHaveBeenCalledTimes(2);
        expect(nativeSensing).toBe(false);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('does not let an old unmount retry stop a newly mounted hook instance', async () => {
        vi.useFakeTimers();
        let nativeSensing = false;
        shakeHost.start.mockImplementation(async () => {
            nativeSensing = true;
        });
        shakeHost.stop
            .mockRejectedValueOnce(new Error('old unmount stop failed'))
            .mockImplementation(async () => {
                nativeSensing = false;
            });

        const firstMount = mount();
        await flush();
        expect(nativeSensing).toBe(true);

        firstMount.unmount();
        await flush();
        expect(shakeHost.stop).toHaveBeenCalledTimes(1);
        expect(vi.getTimerCount()).toBe(1);

        const secondMount = mount();
        await flush();
        expect(nativeSensing).toBe(true);

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(shakeHost.stop).toHaveBeenCalledTimes(1);
        expect(nativeSensing).toBe(true);
        expect(vi.getTimerCount()).toBe(0);

        secondMount.unmount();
        await flush();

        expect(shakeHost.stop).toHaveBeenCalledTimes(2);
        expect(nativeSensing).toBe(false);
    });

    it('keeps process-global sensing active until the final concurrent owner unmounts', async () => {
        let nativeSensing = false;
        shakeHost.start.mockImplementation(async () => {
            nativeSensing = true;
        });
        shakeHost.stop.mockImplementation(async () => {
            nativeSensing = false;
        });

        const firstMount = mount();
        const secondMount = mount();
        await flush();

        expect(shakeHost.start).toHaveBeenCalledTimes(1);
        expect(nativeSensing).toBe(true);

        firstMount.unmount();
        await flush();

        expect(shakeHost.stop).not.toHaveBeenCalled();
        expect(nativeSensing).toBe(true);

        secondMount.unmount();
        await flush();

        expect(shakeHost.stop).toHaveBeenCalledTimes(1);
        expect(nativeSensing).toBe(false);
    });

    it('stops retrying after bounded persistent failures without leaving timers', async () => {
        vi.useFakeTimers();
        shakeHost.start.mockRejectedValue(new Error('persistent start failure'));

        const { unmount } = mount();
        await flush();

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(shakeHost.start).toHaveBeenCalledTimes(3);
        expect(loggerHost.warn).toHaveBeenCalledTimes(3);
        expect(vi.getTimerCount()).toBe(0);

        unmount();
        await flush();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('cancels an obsolete retry and applies the latest desired state', async () => {
        vi.useFakeTimers();
        let nativeSensing = false;
        shakeHost.start
            .mockRejectedValueOnce(new Error('start failed'))
            .mockImplementation(async () => {
                nativeSensing = true;
            });
        shakeHost.stop.mockImplementation(async () => {
            nativeSensing = false;
        });

        const { unmount } = mount();
        await flush();
        expect(vi.getTimerCount()).toBe(1);

        act(() => {
            appStateCallback!({ isActive: false });
        });
        await flush();
        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(shakeHost.start).toHaveBeenCalledTimes(1);
        expect(shakeHost.stop).not.toHaveBeenCalled();
        expect(nativeSensing).toBe(false);
        expect(vi.getTimerCount()).toBe(0);

        act(() => {
            appStateCallback!({ isActive: true });
        });
        await flush();

        expect(shakeHost.start).toHaveBeenCalledTimes(2);
        expect(nativeSensing).toBe(true);

        unmount();
        await flush();
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
