import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFirebaseSignInAdapter } from '../createFirebaseSignInAdapter';
import type {
    FirebaseAuthLike,
    FirebaseSignInAdapterConfig,
    NativeFirebaseAuthLike,
} from '../types';

const sdk = vi.hoisted(() => ({
    sendSignInLinkToEmail: vi.fn(),
    isSignInWithEmailLink: vi.fn(),
    signInWithEmailLink: vi.fn(),
    signInWithPhoneNumber: vi.fn(),
    signInWithCredential: vi.fn(),
    signInWithPopup: vi.fn(),
    signInWithCustomToken: vi.fn(),
    getRedirectResult: vi.fn(),
    deleteUser: vi.fn(),
    onAuthStateChanged: vi.fn(),
    credential: vi.fn(),
    credentialFromResult: vi.fn(),
    credentialWithLink: vi.fn(),
    googleCredential: vi.fn(),
    phoneCredential: vi.fn(),
    ensureRecaptcha: vi.fn(),
    destroyRecaptcha: vi.fn(),
    getPlatform: vi.fn(),
}));
vi.mock('firebase/auth', () => ({
    ...sdk,
    OAuthProvider: class {
        credential = sdk.credential;
        static credentialFromResult = sdk.credentialFromResult;
    },
    GoogleAuthProvider: class {
        static credential = sdk.googleCredential;
    },
    EmailAuthProvider: { credentialWithLink: sdk.credentialWithLink },
    PhoneAuthProvider: { credential: sdk.phoneCredential },
}));
vi.mock('../../helpers/recaptcha.helpers', () => ({
    ensureRecaptcha: sdk.ensureRecaptcha,
    destroyRecaptcha: sdk.destroyRecaptcha,
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: sdk.getPlatform } }));
vi.mock('../../logging/logger', () => ({
    getLogger: (): object => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

const user = {
    uid: 'user-1',
    email: 'test@example.org',
    phoneNumber: null,
    displayName: null,
    photoURL: null,
    metadata: { creationTime: '2024-01-01' },
    getIdToken: vi.fn(),
};
let auth: FirebaseAuthLike;
let codeSent: ((event: { verificationId: string }) => void) | undefined;
let autoVerified: ((event: { verificationCode?: string }) => void) | undefined;
let phoneFailed: ((event: { message: string }) => void) | undefined;
const remove = vi.fn();
const nativeUser = { ...user, photoUrl: null, metadata: { creationTime: 1704067200000 } };
const native: NativeFirebaseAuthLike = {
    signInWithGoogle: vi.fn(),
    signInWithApple: vi.fn(),
    getCurrentUser: vi.fn(),
    getIdToken: vi.fn(),
    sendSignInLinkToEmail: vi.fn(),
    isSignInWithEmailLink: vi.fn(),
    signOut: vi.fn(),
    signInWithPhoneNumber: vi.fn(),
    addListener: vi.fn(async (event: string, callback: unknown) => {
        if (event === 'phoneCodeSent') codeSent = callback as typeof codeSent;
        if (event === 'phoneVerificationCompleted') autoVerified = callback as typeof autoVerified;
        if (event === 'phoneVerificationFailed') phoneFailed = callback as typeof phoneFailed;
        return { remove };
    }),
};
const create = (
    extra: Partial<FirebaseSignInAdapterConfig> = {}
): ReturnType<typeof createFirebaseSignInAdapter> =>
    createFirebaseSignInAdapter({ getAuth: () => auth, getNativeAuth: () => native, ...extra });

beforeEach(() => {
    vi.clearAllMocks();
    auth = { currentUser: user, signOut: vi.fn() };
    const storage = new Map<string, string>();
    vi.stubGlobal('window', {
        location: { origin: 'https://app.example.org' },
        localStorage: {
            getItem: (key: string): string | null => storage.get(key) ?? null,
            setItem: (key: string, value: string): void => {
                storage.set(key, value);
            },
            removeItem: (key: string): void => {
                storage.delete(key);
            },
        },
    });
    user.getIdToken.mockResolvedValue('session-token');
    sdk.isSignInWithEmailLink.mockReturnValue(true);
    sdk.signInWithEmailLink.mockResolvedValue({ user });
    sdk.signInWithCredential.mockResolvedValue({ user });
    sdk.signInWithCustomToken.mockResolvedValue({ user });
    sdk.signInWithPopup.mockResolvedValue({ user });
    sdk.credentialFromResult.mockReturnValue({ providerId: 'apple.com' });
    sdk.ensureRecaptcha.mockResolvedValue('verifier');
    sdk.getPlatform.mockReturnValue('android');
    vi.mocked(native.signInWithPhoneNumber!).mockResolvedValue(undefined);
    vi.mocked(native.signInWithGoogle).mockResolvedValue({
        user: nativeUser,
        credential: { idToken: 'google-token' },
    });
    vi.mocked(native.signInWithApple).mockResolvedValue({
        user: nativeUser,
        credential: { idToken: 'apple-token', nonce: 'nonce' },
    });
    vi.mocked(native.getCurrentUser).mockResolvedValue({ user: nativeUser });
    vi.mocked(native.getIdToken).mockResolvedValue({ token: 'native-token' });
    vi.mocked(native.isSignInWithEmailLink).mockResolvedValue({ isSignInWithEmailLink: true });
    remove.mockResolvedValue(undefined);
    codeSent = undefined;
    autoVerified = undefined;
    phoneFailed = undefined;
});
afterEach(() => vi.unstubAllGlobals());

describe('Firebase sign-in adapter', () => {
    it('declares immutable capabilities including server-backed email OTP', () => {
        expect(create().capabilities).toEqual({
            emailLink: true,
            emailOtp: true,
            phoneOtp: true,
            google: true,
            apple: true,
            social: true,
            customToken: true,
            deleteAccount: true,
        });
        expect(Object.isFrozen(create().capabilities)).toBe(true);
        expect(
            create({ getNativeAuth: undefined, isNativePlatform: () => true }).capabilities.phoneOtp
        ).toBe(false);
    });

    it('sends a web link with a redirect override and remembers the email', async () => {
        await create().sendEmailLink(user.email, 'https://app.example.org/claim');
        expect(sdk.sendSignInLinkToEmail).toHaveBeenCalledWith(auth, user.email, {
            url: 'https://app.example.org/claim',
            handleCodeInApp: true,
        });
        expect(window.localStorage.getItem('emailForSignIn')).toBe(user.email);
    });

    it('passes native link settings without leaking them into web settings', async () => {
        const settings = {
            url: 'https://native.example.org/login',
            iOS: { bundleId: 'org.example' },
            android: { packageName: 'org.example', installApp: true, minimumVersion: '12' },
            dynamicLinkDomain: 'link.example.org',
        };
        await create({
            isNativePlatform: () => true,
            nativeEmailLinkSettings: settings,
        }).sendEmailLink(user.email);
        expect(native.sendSignInLinkToEmail).toHaveBeenCalledWith({
            email: user.email,
            actionCodeSettings: { ...settings, handleCodeInApp: true },
        });
        expect(sdk.sendSignInLinkToEmail).not.toHaveBeenCalled();
    });

    it('verifies a web email link, refreshes its token, and returns a generic user', async () => {
        window.localStorage.setItem('emailForSignIn', user.email);
        const result = await create().verifyEmailLink(user.email, 'link');
        expect(sdk.isSignInWithEmailLink).toHaveBeenCalledWith(auth, 'link');
        expect(sdk.signInWithEmailLink).toHaveBeenCalledWith(auth, user.email, 'link');
        expect(user.getIdToken).toHaveBeenCalledWith(true);
        expect(result.id).toBe(user.uid);
        expect(result).not.toHaveProperty('getIdToken');
        expect(window.localStorage.getItem('emailForSignIn')).toBeNull();
    });

    it('verifies native links on the web layer using the remembered email', async () => {
        window.localStorage.setItem('emailForSignIn', 'remembered@example.org');
        await create({ isNativePlatform: () => true }).verifyEmailLink(user.email, 'native-link');
        expect(native.isSignInWithEmailLink).toHaveBeenCalledWith({ emailLink: 'native-link' });
        expect(sdk.credentialWithLink).toHaveBeenCalledWith(
            'remembered@example.org',
            'native-link'
        );
        expect(user.getIdToken).toHaveBeenCalledWith(undefined);
        expect(sdk.signInWithEmailLink).not.toHaveBeenCalled();
    });

    it('rejects invalid links without signing in or clearing the remembered email', async () => {
        sdk.isSignInWithEmailLink.mockReturnValue(false);
        window.localStorage.setItem('emailForSignIn', user.email);
        await expect(create().verifyEmailLink(user.email, 'bad')).rejects.toThrow('Invalid');
        expect(sdk.signInWithEmailLink).not.toHaveBeenCalled();
        expect(window.localStorage.getItem('emailForSignIn')).toBe(user.email);
    });

    it('preserves SDK errors for each app to map, including failed token checks', async () => {
        const error = { code: 'auth/network-request-failed', message: 'offline' };
        user.getIdToken.mockRejectedValueOnce(error);
        const onOperation = vi.fn();
        await expect(create({ onOperation }).verifyEmailLink(user.email, 'link')).rejects.toBe(
            error
        );
        expect(onOperation).toHaveBeenLastCalledWith('verifyEmailLink', 'failed', error);
    });

    it('owns web OTP state, permits retry, and consumes it after success', async () => {
        const confirm = vi
            .fn()
            .mockRejectedValueOnce({ code: 'auth/invalid-verification-code' })
            .mockResolvedValue({ user });
        sdk.signInWithPhoneNumber.mockResolvedValue({ verificationId: 'web-id', confirm });
        const adapter = create();
        const sent = vi.fn();
        adapter.onPhoneCodeSent(sent);
        await expect(adapter.confirmPhoneOtp('123456')).rejects.toThrow('Request a phone code');
        await adapter.sendPhoneOtp('+15555550100');
        expect(window.confirmationResult).toBeUndefined();
        expect(sdk.signInWithPhoneNumber).toHaveBeenCalledWith(auth, '+15555550100', 'verifier');
        expect(sent).toHaveBeenCalledOnce();
        await expect(adapter.confirmPhoneOtp('000000')).rejects.toEqual({
            code: 'auth/invalid-verification-code',
        });
        await expect(adapter.confirmPhoneOtp(123456)).resolves.toMatchObject({ id: user.uid });
        expect(confirm).toHaveBeenLastCalledWith('123456');
        expect(user.getIdToken).toHaveBeenCalledWith(true);
        await expect(adapter.confirmPhoneOtp('123456')).rejects.toThrow('Request a phone code');
    });

    it('keeps the legacy handle and native verification-ID APIs working', async () => {
        const confirm = vi.fn().mockResolvedValue({ user });
        const adapter = create();
        await adapter.confirmPhoneOtp({ verificationId: 'old', _internal: { confirm } }, '123456');
        await adapter.confirmNativePhoneOtp?.('native-id', 123456);
        expect(sdk.phoneCredential).toHaveBeenCalledWith('native-id', '123456');
    });

    it('cleans recaptcha after send errors and invalidates the previous request on resend', async () => {
        sdk.signInWithPhoneNumber
            .mockResolvedValueOnce({ verificationId: 'old', confirm: vi.fn() })
            .mockRejectedValueOnce({ code: 'auth/too-many-requests' });
        const adapter = create();
        await adapter.sendPhoneOtp('+15555550100');
        await expect(adapter.sendPhoneOtp('+15555550101')).rejects.toEqual({
            code: 'auth/too-many-requests',
        });
        expect(sdk.destroyRecaptcha).toHaveBeenCalled();
        await expect(adapter.confirmPhoneOtp('123456')).rejects.toThrow('Request a phone code');
    });

    it.each(['android', 'ios'])(
        'waits for native code sent on %s and keeps the ID internally',
        async platform => {
            sdk.getPlatform.mockReturnValue(platform);
            const adapter = create({ isNativePlatform: () => true });
            const sent = vi.fn();
            const unsubscribe = adapter.onPhoneCodeSent(sent);
            const request = adapter.sendPhoneOtp('+15555550100');
            await vi.waitFor(() => expect(native.signInWithPhoneNumber).toHaveBeenCalled());
            expect(native.signInWithPhoneNumber).toHaveBeenCalledWith({
                phoneNumber: '+15555550100',
                skipNativeAuth: platform === 'android',
            });
            expect(native.addListener).toHaveBeenCalledTimes(3);
            codeSent?.({ verificationId: 'native-id' });
            await request;
            expect(sent).toHaveBeenCalledOnce();
            unsubscribe();
            const auto = vi.fn();
            adapter.onPhoneVerificationCompleted(auto);
            autoVerified?.({ verificationCode: '654321' });
            expect(auto).toHaveBeenCalledWith('654321');
            await adapter.confirmPhoneOtp('654321');
            expect(sdk.phoneCredential).toHaveBeenCalledWith('native-id', '654321');
            expect(remove).toHaveBeenCalledTimes(3);
            expect(sdk.ensureRecaptcha).not.toHaveBeenCalled();
        }
    );

    it('rejects native failures and cleanup cancels pending requests and ignores late events', async () => {
        const adapter = create({ isNativePlatform: () => true });
        const request = adapter.sendPhoneOtp('+15555550100');
        const failure = expect(request).rejects.toThrow('denied');
        await vi.waitFor(() => expect(native.signInWithPhoneNumber).toHaveBeenCalled());
        phoneFailed?.({ message: 'denied' });
        await failure;
        const again = adapter.sendPhoneOtp('+15555550100');
        const cancelled = expect(again).rejects.toThrow('cancelled');
        await vi.waitFor(() => expect(native.signInWithPhoneNumber).toHaveBeenCalledTimes(2));
        const late = codeSent;
        adapter.cleanup?.();
        late?.({ verificationId: 'late' });
        await cancelled;
        await expect(adapter.confirmPhoneOtp('123456')).rejects.toThrow('Request a phone code');
    });

    it('checks native Google user/token and tolerates a failed secondary credential sync', async () => {
        sdk.signInWithCredential.mockRejectedValueOnce(new Error('sync failed'));
        const onSignedIn = vi.fn();
        const onCredentialSyncError = vi.fn();
        const result = await create({
            isNativePlatform: () => true,
            onSignedIn,
            onCredentialSyncError,
        }).signInWithGoogle();
        expect(result.id).toBe(user.uid);
        expect(native.getIdToken).toHaveBeenCalledOnce();
        expect(onSignedIn).toHaveBeenCalledWith('google', result);
        expect(onCredentialSyncError).toHaveBeenCalledOnce();
    });

    it('uses the plugin for normal web Google login but popup for reauthentication', async () => {
        const adapter = create();
        await adapter.signInWithGoogle();
        expect(native.signInWithGoogle).toHaveBeenCalledOnce();
        expect(sdk.signInWithPopup).not.toHaveBeenCalled();
        await adapter.signInWithGoogle({ intent: 'reauthenticate' });
        expect(sdk.signInWithPopup).toHaveBeenCalledOnce();
    });

    it('bridges native Apple nonce and checks web Apple credentials and redirect results', async () => {
        await create({ isNativePlatform: () => true }).signInWithApple();
        expect(native.signInWithApple).toHaveBeenCalledWith({ skipNativeAuth: true });
        expect(sdk.credential).toHaveBeenCalledWith({ idToken: 'apple-token', rawNonce: 'nonce' });
        await create().signInWithApple();
        expect(user.getIdToken).toHaveBeenLastCalledWith(true);
        sdk.getRedirectResult.mockResolvedValue({ user });
        await expect(create().checkRedirectResult?.()).resolves.toMatchObject({ id: user.uid });
        sdk.credentialFromResult.mockReturnValueOnce(null);
        await expect(create().checkRedirectResult?.()).resolves.toBeNull();
    });

    it('exchanges custom/OIDC tokens and deletes the current SDK user', async () => {
        const adapter = create();
        await adapter.signInWithCustomToken('custom-token');
        await adapter.signInWithOidcCredential?.('oidc.keycloak-world-scouts-sso', 'oidc-token');
        expect(sdk.signInWithCustomToken).toHaveBeenCalledWith(auth, 'custom-token');
        expect(sdk.credential).toHaveBeenCalledWith({ idToken: 'oidc-token' });
        expect(user.getIdToken).toHaveBeenCalledTimes(2);
        await adapter.deleteAccount();
        expect(sdk.deleteUser).toHaveBeenCalledWith(user);
    });
});
