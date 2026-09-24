import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    signInWithGoogle: vi.fn(),
    signInWithApple: vi.fn(),
}));

vi.mock('@capacitor-firebase/authentication', () => ({
    FirebaseAuthentication: {
        signInWithGoogle: mocks.signInWithGoogle,
        signInWithApple: mocks.signInWithApple,
    },
}));

import { getNativeAppleIdToken, getNativeGoogleIdToken } from './nativeSocialTokens';

describe('native social ID tokens', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns the Google credential idToken with native Firebase auth skipped', async () => {
        mocks.signInWithGoogle.mockResolvedValue({ credential: { idToken: 'google-id-token' } });
        await expect(getNativeGoogleIdToken()).resolves.toBe('google-id-token');
        expect(mocks.signInWithGoogle).toHaveBeenCalledWith({ skipNativeAuth: true });
    });

    it('throws a friendly session error when Google sign-in returns no credential', async () => {
        mocks.signInWithGoogle.mockResolvedValue({ credential: null });
        await expect(getNativeGoogleIdToken()).rejects.toMatchObject({
            name: 'AuthSessionError',
            reason: 'no_session',
        });
    });

    it('throws a friendly session error when the Google credential has no idToken', async () => {
        mocks.signInWithGoogle.mockResolvedValue({ credential: { idToken: undefined } });
        await expect(getNativeGoogleIdToken()).rejects.toMatchObject({
            name: 'AuthSessionError',
            reason: 'no_session',
        });
    });

    it('returns the Apple credential idToken with native Firebase auth skipped', async () => {
        mocks.signInWithApple.mockResolvedValue({ credential: { idToken: 'apple-id-token' } });
        await expect(getNativeAppleIdToken()).resolves.toBe('apple-id-token');
        expect(mocks.signInWithApple).toHaveBeenCalledWith({ skipNativeAuth: true });
    });

    it('throws a friendly session error when Apple sign-in returns no credential', async () => {
        mocks.signInWithApple.mockResolvedValue({ credential: undefined });
        await expect(getNativeAppleIdToken()).rejects.toMatchObject({
            name: 'AuthSessionError',
            reason: 'no_session',
        });
    });
});
