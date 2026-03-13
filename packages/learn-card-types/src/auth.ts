/**
 * Provider-agnostic interfaces for authentication and key derivation.
 *
 * Both @learncard/sss-key-manager and learn-card-base import from here,
 * ensuring a single canonical source for abstract interfaces without
 * coupling consumers to any specific implementation.
 */

// ---------------------------------------------------------------------------
// Auth Session Error
// ---------------------------------------------------------------------------

/**
 * Typed error for auth session issues.
 * Auth providers should throw this (instead of generic Error) when the
 * session is expired, revoked, or missing so the coordinator can
 * distinguish "not logged in" from "unexpected failure".
 */
export class AuthSessionError extends Error {
    constructor(
        message: string,
        public readonly reason: 'expired' | 'no_session' | 'revoked' | 'network'
    ) {
        super(message);
        this.name = 'AuthSessionError';
    }
}

// ---------------------------------------------------------------------------
// Auth Provider
// ---------------------------------------------------------------------------

/**
 * Auth provider identifier. Known values: 'firebase', 'supertokens', 'keycloak', 'oidc'.
 * Use any string to support custom auth providers without modifying this type.
 */
export type AuthProviderType = string;

export interface AuthUser {
    id: string;
    email?: string;
    phone?: string;
    displayName?: string;
    photoUrl?: string;
    providerType: AuthProviderType;

    /** Account creation timestamp (when available from the auth provider) */
    createdAt?: Date;
}

/**
 * Abstract auth provider interface.
 * Implementations wrap a specific auth SDK (Firebase, Supertokens, etc.)
 * and expose a uniform API to the coordinator.
 */
export interface AuthProvider {
    getIdToken(forceRefresh?: boolean): Promise<string>;
    getCurrentUser(): Promise<AuthUser | null>;
    getProviderType(): AuthProviderType;
    signOut(): Promise<void>;

    /**
     * Attempt to silently refresh the auth session (e.g., force-refresh
     * the JWT using the underlying refresh token).
     *
     * Returns `true` if the session was successfully refreshed.
     * Returns `false` if a full re-authentication is required.
     *
     * Optional — providers that don't implement this will require full
     * re-auth whenever the session expires.
     */
    refreshSession?(): Promise<boolean>;

    /**
     * Re-authenticate with a server-issued token (e.g., a Firebase custom
     * token returned after a server-side account change that invalidates
     * the current session).
     *
     * Returns the refreshed AuthUser read directly from the auth SDK
     * (not from the app store, which may be stale).
     *
     * Optional — only needed by providers whose server-side account
     * mutations invalidate the client session.
     */
    reauthenticateWithToken?(token: string): Promise<AuthUser | null>;
}

// ---------------------------------------------------------------------------
// Sign-In Adapter (Phase 2)
// ---------------------------------------------------------------------------

/**
 * Opaque handle returned by `sendPhoneOtp()`.
 * On web this wraps a ConfirmationResult; on native it carries a verificationId.
 * Consumers pass this back to `confirmPhoneOtp()` — never inspect internals.
 */
export interface PhoneVerificationHandle {
    verificationId: string;

    /** Platform-specific confirmation object (e.g. Firebase ConfirmationResult) */
    _internal?: unknown;
}

/**
 * Abstract sign-in adapter interface.
 *
 * Encapsulates **all** provider-specific sign-in logic (Firebase, Supertokens,
 * Keycloak, …).  Apps register a concrete adapter at startup via
 * `registerSignInAdapterFactory()` and resolve it through the provider registry.
 *
 * The `subscribe()` method is the **single source of truth** for auth state:
 * `SignInAdapterProvider` calls it once and writes every state change to
 * `authUserStore`, replacing the Phase 1 bridge.
 *
 * Individual sign-in methods return `Promise<AuthUser>` on success and throw
 * on failure — the app-level hook (`useFirebase` / `useAuth`) handles UI
 * feedback (toasts, modals, analytics).
 */
export interface SignInAdapter {
    readonly providerType: AuthProviderType;

    // --- Auth state ---

    /**
     * Subscribe to auth-state changes.  The callback fires immediately with
     * the current state and again on every sign-in / sign-out.
     *
     * Returns an unsubscribe function.
     */
    subscribe(onUser: (user: AuthUser | null) => void): () => void;

    /** Synchronous snapshot of the last user emitted by `subscribe()`. */
    getCurrentUser(): AuthUser | null;

    // --- Email link (passwordless) ---

    sendEmailLink(email: string, redirectUrl?: string): Promise<void>;

    verifyEmailLink(email: string, link: string): Promise<AuthUser>;

    isEmailLink(link: string): boolean;

    // --- Phone OTP ---

    /**
     * Send an SMS OTP to the given number.
     * On web this sets up a RecaptchaVerifier transparently.
     */
    sendPhoneOtp(phoneNumber: string): Promise<PhoneVerificationHandle>;

    /**
     * Confirm a phone OTP using the handle returned by `sendPhoneOtp()`.
     */
    confirmPhoneOtp(handle: PhoneVerificationHandle, code: string | number): Promise<AuthUser>;

    /**
     * Confirm a phone OTP using a native verificationId (Capacitor auto-verify
     * path).  Falls back to `confirmPhoneOtp` when not implemented.
     */
    confirmNativePhoneOtp?(verificationId: string, code: string | number): Promise<AuthUser>;

    // --- OAuth ---

    signInWithGoogle(): Promise<AuthUser>;

    signInWithApple(): Promise<AuthUser>;

    /** Check for a pending OAuth redirect result (e.g. Apple on web). */
    checkRedirectResult?(): Promise<AuthUser | null>;

    // --- Custom / SSO ---

    signInWithCustomToken(token: string): Promise<AuthUser>;

    /** Sign in with an OIDC credential (e.g. Keycloak World Scouts SSO). */
    signInWithOidcCredential?(providerId: string, idToken: string): Promise<AuthUser>;

    // --- Account management ---

    deleteAccount(): Promise<void>;

    signOut(): Promise<void>;

    // --- Cleanup ---

    /** Tear down any DOM elements created by the adapter (e.g. RecaptchaVerifier). */
    cleanup?(): void;
}

// ---------------------------------------------------------------------------
// Recovery (generic)
// ---------------------------------------------------------------------------

/**
 * Recovery method metadata returned by the server.
 * The `type` is a string so strategies can define their own method types
 * without modifying this interface.
 */
export interface RecoveryMethodInfo {
    type: string;
    createdAt: Date;
    credentialId?: string;
}

/**
 * Generic result of a successful recovery execution.
 * All strategies must produce a private key + DID.
 */
export interface RecoveryResult {
    privateKey: string;
    did: string;
}

// ---------------------------------------------------------------------------
// Server Key Status
// ---------------------------------------------------------------------------

/**
 * Server key status returned by the strategy's fetchServerKeyStatus.
 * The strategy owns the server shape — different strategies may
 * have fundamentally different server payloads.
 */
export interface ServerKeyStatus {
    exists: boolean;
    needsMigration: boolean;
    primaryDid: string | null;
    recoveryMethods: RecoveryMethodInfo[];
    authShare: string | null;
    shareVersion: number | null;
    maskedRecoveryEmail?: string | null;
}

// ---------------------------------------------------------------------------
// Key Derivation Capabilities
// ---------------------------------------------------------------------------

/**
 * Declarative capability flags for a key derivation strategy.
 *
 * UI components read these to decide which features to show.
 * Each strategy declares its own capabilities — no strategy-specific
 * checks needed in the UI layer.
 *
 * All flags default to `false` when absent.
 *
 * @example
 * ```ts
 * // SSS declares full capabilities:
 * capabilities: { recovery: true, deviceLinking: true, localKeyPersistence: true }
 *
 * // Web3Auth derives keys on-demand, nothing local to manage:
 * capabilities: { recovery: false, deviceLinking: false, localKeyPersistence: false }
 * ```
 */
export interface KeyDerivationCapabilities {
    /** Strategy supports user-facing recovery methods (setup + execution) */
    recovery: boolean;

    /** Strategy supports cross-device key transfer (e.g., QR-based device linking) */
    deviceLinking: boolean;

    /**
     * Strategy persists key material locally (e.g., device share in IndexedDB).
     * When true, "public computer" / "forget device" features are relevant.
     */
    localKeyPersistence: boolean;

    /**
     * Strategy supports upgrading the user's contact method (e.g., phone → email).
     * When true, the `upgradeContactMethod` method is available and the
     * email-linking gate can be shown for phone-only users.
     */
    contactMethodUpgrade: boolean;
}

// ---------------------------------------------------------------------------
// Key Derivation Strategy (generic)
// ---------------------------------------------------------------------------

/**
 * Key Derivation Strategy
 *
 * Abstract interface for different key derivation implementations.
 * Used by AuthCoordinator to delegate key operations.
 *
 * The strategy owns:
 * - Local key storage
 * - Key splitting and reconstruction
 * - Server communication for remote key components
 * - Recovery method execution and setup
 * - Storage cleanup knowledge
 *
 * Type parameters allow each strategy to define its own recovery shapes:
 * - TRecoveryInput: what the user provides to recover (e.g., password, passkey)
 * - TRecoverySetupInput: what the user provides to set up a recovery method
 * - TRecoverySetupResult: what setup returns (e.g., generated phrase, credential ID)
 *
 * @example
 * // SSS strategy with specific recovery types:
 * type SSSStrategy = KeyDerivationStrategy<SSSRecoveryInput, SSSRecoverySetupInput, SSSRecoverySetupResult>;
 *
 * // Simple strategy with no recovery:
 * type SimpleStrategy = KeyDerivationStrategy<never, never, never>;
 */
export interface KeyDerivationStrategy<
    TRecoveryInput = unknown,
    TRecoverySetupInput = unknown,
    TRecoverySetupResult = unknown,
> {
    readonly name: string;

    /** Declarative feature flags — UI reads these to gate features */
    readonly capabilities: KeyDerivationCapabilities;

    // --- Key lifecycle ---

    /** Check if there's a local key component (e.g., device share) */
    hasLocalKey(): Promise<boolean>;

    /** Get the local key component */
    getLocalKey(): Promise<string | null>;

    /** Store a local key component */
    storeLocalKey(key: string): Promise<void>;

    /** Clear all local key data */
    clearLocalKeys(): Promise<void>;

    /** Split a private key into shares/components */
    splitKey(privateKey: string): Promise<{ localKey: string; remoteKey: string }>;

    /** Reconstruct private key from components */
    reconstructKey(localKey: string, remoteKey: string): Promise<string>;

    /** Verify that stored keys can reconstruct the expected DID */
    verifyKeys?(
        localKey: string,
        remoteKey: string,
        expectedDid: string,
        didFromPrivateKey: (pk: string) => Promise<string>
    ): Promise<boolean>;

    // --- Server communication ---

    /** Fetch the server-side key status for the authenticated user */
    fetchServerKeyStatus(token: string, providerType: AuthProviderType): Promise<ServerKeyStatus>;

    /** Store the remote key component on the server */
    storeAuthShare(token: string, providerType: AuthProviderType, remoteKey: string, did: string, didAuthVp?: string): Promise<void>;

    /** Mark migration complete on the server (optional — only needed for migration-capable strategies) */
    markMigrated?(token: string, providerType: AuthProviderType, didAuthVp?: string): Promise<void>;

    // --- Recovery ---

    /** Execute a recovery flow and return the recovered private key + DID */
    executeRecovery(params: {
        token: string;
        providerType: AuthProviderType;
        input: TRecoveryInput;
        /** Optional: validate the reconstructed key's DID before rotating shares */
        didFromPrivateKey?: (privateKey: string) => Promise<string>;
    }): Promise<RecoveryResult>;

    /** Set up a new recovery method */
    setupRecoveryMethod?(params: {
        token: string;
        providerType: AuthProviderType;
        privateKey: string;
        input: TRecoverySetupInput;
        authUser?: AuthUser;
        /** Optional: sign a DID-Auth VP JWT for server write operations */
        signDidAuthVp?: (privateKey: string) => Promise<string>;
    }): Promise<TRecoverySetupResult>;

    /** Get configured recovery methods for the authenticated user */
    getAvailableRecoveryMethods?(token: string, providerType: AuthProviderType): Promise<RecoveryMethodInfo[]>;

    // --- Contact method management ---

    /**
     * Verify email ownership and upgrade the user's contact method on the
     * server (e.g., phone → email). The server verifies the OTP code, links
     * the email to the auth account (passwordless), and atomically updates
     * the UserKey contact method.
     *
     * Strategies that don't manage server-side contact methods can omit this.
     *
     * @param token - Auth token for the current session
     * @param providerType - Auth provider type
     * @param previousPhone - The phone number being replaced
     * @param email - The new email address (already OTP-verified client-side)
     * @param code - The 6-digit verification code
     */
    upgradeContactMethod?(
        token: string,
        providerType: AuthProviderType,
        previousPhone: string,
        email: string,
        code: string
    ): Promise<{ customToken?: string } | void>;

    // --- Email backup ---

    /**
     * Send a backup share to the user's email for fail-safe recovery.
     * Called by the coordinator after key setup or migration.
     * Implementation should be fire-and-forget (non-fatal on failure).
     *
     * @param token - Auth token for server communication
     * @param providerType - Auth provider type
     * @param privateKey - The private key to derive the email share from
     * @param email - Destination email address
     */
    sendEmailBackupShare?(
        token: string,
        providerType: AuthProviderType,
        privateKey: string,
        email: string
    ): Promise<void>;

    // --- Share versioning ---

    /**
     * Get the share version associated with the local device share.
     * Used to request the matching auth share from the server and to
     * include in QR cross-device transfers.
     *
     * Returns null for legacy shares with no stored version.
     */
    getLocalShareVersion?(): Promise<number | null>;

    /**
     * Store the share version for the local device share.
     * Called after receiving a device share + version via QR transfer.
     */
    storeLocalShareVersion?(version: number): Promise<void>;

    // --- User scoping ---

    /**
     * Inform the strategy which user is active so it can scope local storage
     * (e.g., device shares) per-user. Called by the coordinator after
     * authentication, before any local-key operations.
     *
     * Strategies that don't need per-user scoping can omit this method.
     *
     * @param userId - Stable, unique identifier for the authenticated user
     *                 (e.g., Firebase UID). Must NOT change across sessions.
     */
    setActiveUser?(userId: string): void;

    // --- Cleanup ---

    /** Return storage keys (e.g., IndexedDB database names) that should be preserved during logout */
    getPreservedStorageKeys(): string[];

    /** Strategy-specific cleanup beyond clearLocalKeys (optional) */
    cleanup?(): Promise<void>;
}
