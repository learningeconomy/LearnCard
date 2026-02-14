/**
 * Auth Coordinator Types
 *
 * Core types for the unified auth + key derivation orchestration layer.
 * These types are designed to be provider-agnostic.
 *
 * Provider-agnostic interfaces are canonically defined in @learncard/auth-types.
 * SSS-specific types (RecoveryInput, RecoverySetupInput, etc.) are in @learncard/sss-key-manager.
 * Both are re-exported here so consumers only need to import from learn-card-base.
 */

// --- Provider-agnostic (canonical source: @learncard/auth-types) ---

export { AuthSessionError } from '@learncard/auth-types';

export type {
    KeyDerivationStrategy,
    KeyDerivationCapabilities,
    ServerKeyStatus,
    AuthProvider,
    AuthUser,
    AuthProviderType,
    RecoveryMethodInfo,
    RecoveryResult,
} from '@learncard/auth-types';

// --- SSS-specific (canonical source: @learncard/sss-key-manager) ---

export type {
    RecoveryMethodType,
    RecoveryInput,
    RecoverySetupInput,
    RecoverySetupResult,
    SSSKeyDerivationStrategy,
} from '@learncard/sss-key-manager';

import type { AuthProvider, AuthUser, KeyDerivationStrategy, RecoveryMethodInfo } from '@learncard/auth-types';

/**
 * Why the coordinator entered `needs_recovery`.
 *
 * - `new_device`          — No local key found (first login on this device/browser).
 * - `stale_local_key`     — Local key exists but doesn't match the server
 *                           (shares were rotated on another device).
 * - `missing_server_data` — Local key exists but the server auth share is missing or unreadable.
 */
export type RecoveryReason = 'new_device' | 'stale_local_key' | 'missing_server_data';

export type UnifiedAuthState =
    | { status: 'idle' }
    | { status: 'authenticating' }
    | { status: 'authenticated'; authUser: AuthUser }
    | { status: 'checking_key_status' }
    | { status: 'needs_setup'; authUser: AuthUser }
    | { status: 'needs_migration'; authUser: AuthUser; migrationData?: Record<string, unknown> }
    | { status: 'needs_recovery'; authUser: AuthUser; recoveryMethods: RecoveryMethodInfo[]; recoveryReason: RecoveryReason; maskedRecoveryEmail?: string | null }
    | { status: 'deriving_key' }
    | { status: 'ready'; authUser?: AuthUser; did: string; privateKey: string; authSessionValid: boolean }
    | { status: 'error'; error: string; canRetry: boolean; previousState?: UnifiedAuthState };

/**
 * Auth Coordinator Config
 *
 * The coordinator delegates server communication to the strategy,
 * so there is no separate `api` field. The strategy owns its own
 * server URL and endpoints.
 */
export interface AuthCoordinatorConfig {
    authProvider: AuthProvider;
    keyDerivation: KeyDerivationStrategy;
    onStateChange?: (state: UnifiedAuthState) => void;
    didFromPrivateKey?: (privateKey: string) => Promise<string>;

    /**
     * Optional: sign a DID-Auth VP JWT proving ownership of the private key.
     * Used by the coordinator to authenticate write operations (storeAuthShare,
     * addRecoveryMethod, etc.) with the server. The server verifies the VP JWT
     * to confirm the caller controls the private key for the claimed DID.
     */
    signDidAuthVp?: (privateKey: string) => Promise<string>;

    /**
     * Optional: retrieve a cached private key from secure storage.
     * Enables "private-key-first" initialization — if a cached key exists,
     * the coordinator can reach 'ready' without requiring an active auth session.
     */
    getCachedPrivateKey?: () => Promise<string | null>;

    /**
     * Optional: called after the coordinator completes its own logout cleanup
     * (signOut + clearLocalKeys). Use for app-specific cleanup like clearing
     * stores, databases, and redirecting.
     */
    onLogout?: () => Promise<void>;

    /**
     * Optional: threshold (in ms) for detecting legacy accounts that need migration.
     *
     * When `fetchServerKeyStatus` returns `exists: false` but the auth user's
     * `createdAt` is older than this threshold, the coordinator treats the user
     * as a legacy account needing migration (e.g., Web3Auth → SSS) instead of
     * a brand-new user needing first-time setup.
     *
     * Set to 0 or omit to disable this heuristic (all no-record users = new setup).
     *
     * @default 0 (disabled)
     */
    legacyAccountThresholdMs?: number;
}
