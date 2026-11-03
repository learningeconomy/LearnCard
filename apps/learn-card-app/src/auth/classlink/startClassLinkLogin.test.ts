import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthSessionError } from '@learncard/types';

const { isNative, openSession } = vi.hoisted(() => ({
    isNative: vi.fn(() => true),
    openSession: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: isNative } }));
vi.mock('learn-card-base', () => ({ getLogger: () => ({ error: vi.fn() }) }));
vi.mock('../nativeAuthSession', () => ({ openNativeAuthSession: openSession }));
vi.mock('./classlinkPkce', () => ({
    CLASSLINK_CALLBACK_PATH: '/auth/classlink/callback',
    createClassLinkAttempt: vi.fn(async () => ({
        state: 'state-1',
        nonce: 'nonce-1',
        codeVerifier: 'v'.repeat(64),
        codeChallenge: 'challenge',
        redirectUri: 'com.example.app://auth/classlink/callback',
    })),
}));

import { startClassLinkLogin, toClassLinkCallbackPath } from './startClassLinkLogin';

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
        });
        expect(navigate).toHaveBeenCalledWith('/auth/classlink/callback?code=abc&state=state-1');
    });

    it('treats a cancelled native session as access_denied', async () => {
        openSession.mockRejectedValue(new AuthSessionError('cancelled', 'no_session'));
        const navigate = vi.fn();
        await expect(startClassLinkLogin(getAuthorizeUrl, navigate)).resolves.toBe(false);
        expect(navigate).toHaveBeenCalledWith('/auth/classlink/callback?error=access_denied');
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
