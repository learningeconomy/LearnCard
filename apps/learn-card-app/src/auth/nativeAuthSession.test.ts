import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type UrlListener = (event: { url: string }) => void;
type VoidListener = () => void;

const mocks = vi.hoisted(() => ({
    platform: 'android' as string,
    pluginAvailable: false,
    webAuthStart: vi.fn(),
    webAuthCancel: vi.fn(async () => undefined),
    browserOpen: vi.fn(async () => undefined),
    browserClose: vi.fn(async () => undefined),
    appUrlOpenListener: undefined as UrlListener | undefined,
    browserFinishedListener: undefined as VoidListener | undefined,
    appRemove: vi.fn(async () => undefined),
    browserRemove: vi.fn(async () => undefined),
}));

vi.mock('learn-card-base', () => ({
    getLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

vi.mock('@capacitor/core', () => ({
    Capacitor: {
        getPlatform: () => mocks.platform,
        isPluginAvailable: () => mocks.pluginAvailable,
    },
    registerPlugin: () => ({ start: mocks.webAuthStart, cancel: mocks.webAuthCancel }),
}));

vi.mock('@capacitor/app', () => ({
    App: {
        addListener: vi.fn(async (_event: string, callback: UrlListener) => {
            mocks.appUrlOpenListener = callback;
            return { remove: mocks.appRemove };
        }),
    },
}));

vi.mock('@capacitor/browser', () => ({
    Browser: {
        open: mocks.browserOpen,
        close: mocks.browserClose,
        addListener: vi.fn(async (_event: string, callback: VoidListener) => {
            mocks.browserFinishedListener = callback;
            return { remove: mocks.browserRemove };
        }),
    },
}));

import { openNativeAuthSession } from './nativeAuthSession';

const AUTHORIZE_URL = 'https://auth.example.org/realms/learncard/protocol/openid-connect/auth';
const CALLBACK_PREFIX = 'com.learncard.app://login';

describe('openNativeAuthSession', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        mocks.platform = 'android';
        mocks.pluginAvailable = false;
        mocks.appUrlOpenListener = undefined;
        mocks.browserFinishedListener = undefined;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('Android / system-browser fallback', () => {
        it('installs the appUrlOpen listener before opening the browser, and resolves on the matching callback', async () => {
            const promise = openNativeAuthSession(AUTHORIZE_URL, {
                callbackUrlPrefix: CALLBACK_PREFIX,
                callbackScheme: 'com.learncard.app',
            });
            await vi.advanceTimersByTimeAsync(0);

            expect(mocks.appUrlOpenListener).toBeInstanceOf(Function);
            expect(mocks.browserOpen).toHaveBeenCalledWith({ url: AUTHORIZE_URL });

            const callbackUrl = `${CALLBACK_PREFIX}?code=abc&state=xyz`;
            mocks.appUrlOpenListener?.({ url: callbackUrl });

            await expect(promise).resolves.toBe(callbackUrl);
            expect(mocks.browserClose).toHaveBeenCalled();
            expect(mocks.appRemove).toHaveBeenCalled();
            expect(mocks.browserRemove).toHaveBeenCalled();
        });

        it('ignores appUrlOpen events that do not match the callback prefix', async () => {
            const promise = openNativeAuthSession(AUTHORIZE_URL, {
                callbackUrlPrefix: CALLBACK_PREFIX,
                callbackScheme: 'com.learncard.app',
            });
            await vi.advanceTimersByTimeAsync(0);

            mocks.appUrlOpenListener?.({ url: 'com.learncard.app://other?x=1' });
            mocks.appUrlOpenListener?.({ url: `${CALLBACK_PREFIX}?code=abc&state=xyz` });

            await expect(promise).resolves.toBe(`${CALLBACK_PREFIX}?code=abc&state=xyz`);
        });

        it('rejects as cancelled when the browser closes without a callback', async () => {
            const promise = openNativeAuthSession(AUTHORIZE_URL, {
                callbackUrlPrefix: CALLBACK_PREFIX,
                callbackScheme: 'com.learncard.app',
            });
            // Attach the rejection handler before advancing timers so the
            // rejection is never briefly "unhandled" from Node's perspective.
            const assertion = expect(promise).rejects.toMatchObject({
                name: 'AuthSessionError',
                reason: 'no_session',
            });
            await vi.advanceTimersByTimeAsync(0);

            mocks.browserFinishedListener?.();
            await vi.advanceTimersByTimeAsync(750);

            await assertion;
        });

        it('does not reject when the callback arrives just before the browserFinished grace window elapses', async () => {
            const promise = openNativeAuthSession(AUTHORIZE_URL, {
                callbackUrlPrefix: CALLBACK_PREFIX,
                callbackScheme: 'com.learncard.app',
            });
            await vi.advanceTimersByTimeAsync(0);

            mocks.browserFinishedListener?.();
            mocks.appUrlOpenListener?.({ url: `${CALLBACK_PREFIX}?code=abc&state=xyz` });
            await vi.advanceTimersByTimeAsync(750);

            await expect(promise).resolves.toBe(`${CALLBACK_PREFIX}?code=abc&state=xyz`);
        });

        it('rejects as expired after the overall five-minute timeout', async () => {
            const promise = openNativeAuthSession(AUTHORIZE_URL, {
                callbackUrlPrefix: CALLBACK_PREFIX,
                callbackScheme: 'com.learncard.app',
            });
            const assertion = expect(promise).rejects.toMatchObject({
                name: 'AuthSessionError',
                reason: 'expired',
            });
            await vi.advanceTimersByTimeAsync(0);
            await vi.advanceTimersByTimeAsync(5 * 60 * 1000);

            await assertion;
        });

        it('falls back to the system browser on iOS when the WebAuthSession plugin is unavailable', async () => {
            mocks.platform = 'ios';
            mocks.pluginAvailable = false;

            const promise = openNativeAuthSession(AUTHORIZE_URL, {
                callbackUrlPrefix: CALLBACK_PREFIX,
                callbackScheme: 'com.learncard.app',
            });
            await vi.advanceTimersByTimeAsync(0);

            expect(mocks.browserOpen).toHaveBeenCalledWith({ url: AUTHORIZE_URL });
            mocks.appUrlOpenListener?.({ url: `${CALLBACK_PREFIX}?code=abc&state=xyz` });
            await expect(promise).resolves.toBe(`${CALLBACK_PREFIX}?code=abc&state=xyz`);
            expect(mocks.webAuthStart).not.toHaveBeenCalled();
        });
    });

    describe('iOS WebAuthSession plugin', () => {
        beforeEach(() => {
            mocks.platform = 'ios';
            mocks.pluginAvailable = true;
        });

        it('resolves with the callback URL from the native plugin', async () => {
            mocks.webAuthStart.mockResolvedValue({
                url: `${CALLBACK_PREFIX}?code=abc&state=xyz`,
            });

            await expect(
                openNativeAuthSession(AUTHORIZE_URL, {
                    callbackUrlPrefix: CALLBACK_PREFIX,
                    callbackScheme: 'com.learncard.app',
                })
            ).resolves.toBe(`${CALLBACK_PREFIX}?code=abc&state=xyz`);

            expect(mocks.webAuthStart).toHaveBeenCalledWith({
                url: AUTHORIZE_URL,
                callbackScheme: 'com.learncard.app',
                ephemeral: true,
            });
            expect(mocks.browserOpen).not.toHaveBeenCalled();
        });

        it('maps a CANCELED plugin rejection to a friendly AuthSessionError', async () => {
            mocks.webAuthStart.mockRejectedValue(
                Object.assign(new Error('canceled'), {
                    code: 'CANCELED',
                })
            );

            await expect(
                openNativeAuthSession(AUTHORIZE_URL, {
                    callbackUrlPrefix: CALLBACK_PREFIX,
                    callbackScheme: 'com.learncard.app',
                })
            ).rejects.toMatchObject({ name: 'AuthSessionError', reason: 'no_session' });
        });

        it('propagates non-CANCELED plugin failures unchanged', async () => {
            const failure = Object.assign(new Error('Unable to start the sign-in sheet'), {
                code: 'FAILED',
            });
            mocks.webAuthStart.mockRejectedValue(failure);

            await expect(
                openNativeAuthSession(AUTHORIZE_URL, {
                    callbackUrlPrefix: CALLBACK_PREFIX,
                    callbackScheme: 'com.learncard.app',
                })
            ).rejects.toBe(failure);
        });

        it('cancels the native sheet and rejects as expired when start() never settles', async () => {
            mocks.webAuthStart.mockReturnValue(new Promise(() => undefined));

            const pending = openNativeAuthSession(AUTHORIZE_URL, {
                callbackUrlPrefix: CALLBACK_PREFIX,
                callbackScheme: 'com.learncard.app',
            });
            const outcome = expect(pending).rejects.toMatchObject({
                name: 'AuthSessionError',
                reason: 'expired',
            });

            await vi.advanceTimersByTimeAsync(60 * 1000);

            await outcome;
            expect(mocks.webAuthCancel).toHaveBeenCalledTimes(1);
        });

        it('reports expiry, not cancellation, when the watchdog-triggered cancel rejects start() with CANCELED', async () => {
            let rejectStart: ((error: unknown) => void) | undefined;
            mocks.webAuthStart.mockReturnValue(
                new Promise((_, reject) => {
                    rejectStart = reject;
                })
            );
            mocks.webAuthCancel.mockImplementation(async () => {
                rejectStart?.(Object.assign(new Error('canceled'), { code: 'CANCELED' }));
            });

            const pending = openNativeAuthSession(AUTHORIZE_URL, {
                callbackUrlPrefix: CALLBACK_PREFIX,
                callbackScheme: 'com.learncard.app',
            });
            const outcome = expect(pending).rejects.toMatchObject({ reason: 'expired' });

            await vi.advanceTimersByTimeAsync(60 * 1000);

            await outcome;
        });

        it('does not fire the watchdog once start() has resolved', async () => {
            mocks.webAuthStart.mockResolvedValue({ url: `${CALLBACK_PREFIX}?code=a&state=b` });

            await openNativeAuthSession(AUTHORIZE_URL, {
                callbackUrlPrefix: CALLBACK_PREFIX,
                callbackScheme: 'com.learncard.app',
            });
            await vi.advanceTimersByTimeAsync(60 * 1000);

            expect(mocks.webAuthCancel).not.toHaveBeenCalled();
        });
    });
});
