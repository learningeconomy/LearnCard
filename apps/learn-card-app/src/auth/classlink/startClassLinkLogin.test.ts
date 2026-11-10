import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthSessionError } from '@learncard/types';

const { isNative, openSession } = vi.hoisted(() => ({
    isNative: vi.fn(() => true),
    openSession: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: isNative } }));
vi.mock('learn-card-base', () => ({ getLogger: () => ({ error: vi.fn() }) }));
vi.mock('../nativeAuthSession', () => ({ openNativeAuthSession: openSession }));
vi.mock('./classlinkPkce', async importOriginal => {
    const actual = await importOriginal<typeof import('./classlinkPkce')>();
    return {
        toClassLinkCallbackPath: actual.toClassLinkCallbackPath,
        setClassLinkNativeSessionInFlight: actual.setClassLinkNativeSessionInFlight,
        isClassLinkNativeSessionInFlight: actual.isClassLinkNativeSessionInFlight,
        CLASSLINK_CALLBACK_PATH: '/auth/classlink/callback',
        createClassLinkAttempt: vi.fn(async () => ({
            state: 'state-1',
            nonce: 'nonce-1',
            codeVerifier: 'v'.repeat(64),
            codeChallenge: 'challenge',
            redirectUri: 'com.example.app://auth/classlink/callback',
        })),
    };
});

import { isClassLinkNativeSessionInFlight } from './classlinkPkce';
import {
    CLASSLINK_NATIVE_SESSION_TIMEOUT_MS,
    runClassLinkLogin,
    startClassLinkLogin,
    toClassLinkCallbackPath,
} from './startClassLinkLogin';

const getAuthorizeUrl = vi.fn(async () => ({ url: 'https://idp.example/authorize?x=1' }));

describe('startClassLinkLogin', () => {
    beforeEach(() => {
        isNative.mockReturnValue(true);
        openSession.mockReset();
        getAuthorizeUrl.mockClear();
    });
    afterEach(() => vi.unstubAllGlobals());

    it('forwards the native callback URL to the in-app callback route', async () => {
        openSession.mockResolvedValue(
            'com.example.app://auth/classlink/callback?code=abc&state=state-1&extra=drop'
        );
        const navigate = vi.fn();
        await expect(startClassLinkLogin(getAuthorizeUrl, navigate)).resolves.toBe(true);
        expect(openSession).toHaveBeenCalledWith('https://idp.example/authorize?x=1', {
            callbackUrlPrefix: 'com.example.app://auth/classlink/callback',
            callbackScheme: 'com.example.app',
            timeoutMs: CLASSLINK_NATIVE_SESSION_TIMEOUT_MS,
        });
        expect(navigate).toHaveBeenCalledWith('/auth/classlink/callback?code=abc&state=state-1');
    });

    it('marks the native session in flight only while the sheet is open', async () => {
        let inFlightDuringSession: boolean | undefined;
        openSession.mockImplementation(async () => {
            inFlightDuringSession = isClassLinkNativeSessionInFlight();
            return 'com.example.app://auth/classlink/callback?code=abc&state=state-1';
        });
        await runClassLinkLogin(getAuthorizeUrl, vi.fn());
        expect(inFlightDuringSession).toBe(true);
        expect(isClassLinkNativeSessionInFlight()).toBe(false);

        openSession.mockRejectedValue(new AuthSessionError('cancelled', 'no_session'));
        await expect(runClassLinkLogin(getAuthorizeUrl, vi.fn())).resolves.toBe('handled');
        expect(isClassLinkNativeSessionInFlight()).toBe(false);
    });

    it('gives interactive ClassLink logins far longer than the 60 s silent-hop default', () => {
        expect(CLASSLINK_NATIVE_SESSION_TIMEOUT_MS).toBe(10 * 60 * 1000);
    });

    it('treats a cancelled native session as access_denied and carries the state', async () => {
        openSession.mockRejectedValue(new AuthSessionError('cancelled', 'no_session'));
        const navigate = vi.fn();
        await expect(startClassLinkLogin(getAuthorizeUrl, navigate)).resolves.toBe(false);
        expect(navigate).toHaveBeenCalledWith(
            '/auth/classlink/callback?error=access_denied&state=state-1'
        );
    });

    it('reports a timed-out native session as login_timeout, not a cancellation', async () => {
        openSession.mockRejectedValue(new AuthSessionError('expired', 'expired'));
        const navigate = vi.fn();
        await expect(runClassLinkLogin(getAuthorizeUrl, navigate)).resolves.toBe('handled');
        expect(navigate).toHaveBeenCalledWith(
            '/auth/classlink/callback?error=login_timeout&state=state-1'
        );
    });

    it('reports failed when the authorize URL cannot be fetched', async () => {
        getAuthorizeUrl.mockRejectedValueOnce(new Error('network'));
        const navigate = vi.fn();
        await expect(runClassLinkLogin(getAuthorizeUrl, navigate)).resolves.toBe('failed');
        expect(navigate).not.toHaveBeenCalled();
    });

    it('uses a full-page redirect on web', async () => {
        isNative.mockReturnValue(false);
        const assign = vi.fn();
        vi.stubGlobal('window', { location: { assign } });
        const navigate = vi.fn();
        await expect(startClassLinkLogin(getAuthorizeUrl, navigate)).resolves.toBe(true);
        expect(assign).toHaveBeenCalledWith('https://idp.example/authorize?x=1');
        expect(navigate).not.toHaveBeenCalled();
    });

    it('keeps only OAuth params when building the callback path', () => {
        expect(toClassLinkCallbackPath('x://cb?error=access_denied&foo=1')).toBe(
            '/auth/classlink/callback?error=access_denied'
        );
        expect(toClassLinkCallbackPath('x://cb')).toBe('/auth/classlink/callback');
    });
});
