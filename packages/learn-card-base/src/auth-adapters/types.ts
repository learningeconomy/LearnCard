import type { AuthUser, PhoneVerificationHandle } from '@learncard/types';

export interface FirebasePhoneAuth {
    sendPhoneOtp(phoneNumber: string): Promise<PhoneVerificationHandle>;
    confirmPhoneOtp(
        handleOrCode: PhoneVerificationHandle | string | number,
        code?: string | number
    ): Promise<AuthUser>;
    onPhoneCodeSent(callback: () => void): () => void;
    onPhoneVerificationCompleted(callback: (code: string | undefined) => void): () => void;
    onPhoneVerificationFailed(callback: (error: unknown) => void): () => void;
    cleanup(): void;
}

/** Structural SDK boundary, compatible with the apps' Firebase Auth instances. */
export interface FirebaseAuthLike {
    currentUser: {
        uid: string;
        email: string | null;
        phoneNumber: string | null;
        displayName: string | null;
        photoURL: string | null;
        getIdToken: (forceRefresh?: boolean) => Promise<string>;
        metadata?: { creationTime?: string };
    } | null;
    signOut: () => Promise<void>;
}

export interface NativeFirebaseUser {
    uid: string;
    email: string | null;
    phoneNumber: string | null;
    displayName: string | null;
    photoUrl: string | null;
    metadata?: { creationTime?: number };
}

export interface NativeSignInResult {
    user: NativeFirebaseUser | null;
    credential?: { idToken?: string; nonce?: string } | null;
}

export interface NativeListenerHandle {
    remove(): Promise<void>;
}

export interface FirebaseEmailLinkSettings {
    url: string;
    iOS?: { bundleId: string };
    android?: { packageName: string; installApp?: boolean; minimumVersion?: string };
    dynamicLinkDomain?: string;
}

/** Only SDK operations actually used by the apps; no dependency on plugin versions. */
export interface NativeFirebaseAuthLike {
    signInWithGoogle(): Promise<NativeSignInResult>;
    signInWithApple(options?: { skipNativeAuth?: boolean }): Promise<NativeSignInResult>;
    getCurrentUser(): Promise<{ user: NativeFirebaseUser | null }>;
    getIdToken(): Promise<{ token: string }>;
    sendSignInLinkToEmail(options: {
        email: string;
        actionCodeSettings: FirebaseEmailLinkSettings & { handleCodeInApp: boolean };
    }): Promise<void>;
    isSignInWithEmailLink(options: {
        emailLink: string;
    }): Promise<{ isSignInWithEmailLink: boolean }>;
    signOut(): Promise<void>;
    // Optional for compatibility with existing social/email-only integrations.
    signInWithPhoneNumber?(options: {
        phoneNumber: string;
        skipNativeAuth: boolean;
    }): Promise<void>;
    addListener?: {
        (
            event: 'phoneCodeSent',
            callback: (event: { verificationId: string }) => void
        ): Promise<NativeListenerHandle>;
        (
            event: 'phoneVerificationCompleted',
            callback: (event: { verificationCode?: string }) => void
        ): Promise<NativeListenerHandle>;
        (
            event: 'phoneVerificationFailed',
            callback: (event: { message: string }) => void
        ): Promise<NativeListenerHandle>;
    };
}

export type FirebaseSignInOperation =
    | 'sendEmailLink'
    | 'verifyEmailLink'
    | 'sendPhoneOtp'
    | 'confirmPhoneOtp'
    | 'google'
    | 'apple'
    | 'redirect'
    | 'customToken'
    | 'oidc'
    | 'deleteAccount'
    | 'signOut';

export interface FirebaseSignInAdapterConfig {
    getAuth: () => FirebaseAuthLike;
    getNativeAuth?: () => NativeFirebaseAuthLike;
    isNativePlatform?: () => boolean;
    emailLinkSettings?: FirebaseEmailLinkSettings;
    /** Native universal-link URL can differ from the web app URL. */
    nativeEmailLinkSettings?: FirebaseEmailLinkSettings;
    /** Optional app instrumentation. SDK errors are rethrown unchanged for UI mapping. */
    onOperation?: (
        operation: FirebaseSignInOperation,
        phase: 'started' | 'succeeded' | 'failed',
        error?: unknown
    ) => void;
    /** Called at the hooks' login bookkeeping point (Google: before web-layer sync). */
    onSignedIn?: (
        method: 'emailLink' | 'phoneOtp' | 'google' | 'apple' | 'customToken' | 'oidc',
        user: AuthUser
    ) => void;
    onCredentialSyncError?: (error: unknown) => void;
}
