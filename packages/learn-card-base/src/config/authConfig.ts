/**
 * Auth Configuration
 *
 * Environment-driven configuration for the auth coordinator.
 * Reads from environment variables with sensible defaults.
 *
 * For each key the lookup order is: VITE_ prefix → REACT_APP_ prefix → default.
 *
 * Environment Variables:
 *   VITE_AUTH_PROVIDER / REACT_APP_AUTH_PROVIDER                   — 'firebase' (default)
 *   VITE_KEY_DERIVATION / REACT_APP_KEY_DERIVATION_PROVIDER        — 'sss' (default)
 *   VITE_SSS_SERVER_URL / REACT_APP_SSS_SERVER_URL                 — 'http://localhost:5100/api' (default)
 *   VITE_ENABLE_EMAIL_BACKUP_SHARE / REACT_APP_ENABLE_EMAIL_BACKUP_SHARE — 'true' (default)
 *   VITE_REQUIRE_EMAIL_FOR_PHONE_USERS / REACT_APP_REQUIRE_EMAIL_FOR_PHONE_USERS — 'true' (default)
 *   VITE_WEB3AUTH_CLIENT_ID                                                 — Web3Auth client ID from dashboard
 *   VITE_WEB3AUTH_NETWORK                                                   — Web3Auth network (e.g. 'testnet', 'cyan', 'sapphire_mainnet')
 *   VITE_WEB3AUTH_VERIFIER_ID                                               — Web3Auth verifier name (e.g. 'learncardapp-firebase')
 *   VITE_WEB3AUTH_RPC_TARGET                                                — Ethereum RPC URL for Web3Auth (e.g. Infura endpoint)
 *
 * For self-hosting, set these in your .env file or deployment environment.
 */

import type { AuthProviderType } from '../auth-coordinator/types';
import type { TenantConfig } from './tenantConfig';

export type KeyDerivationProviderType = 'sss' | 'web3auth';

export interface AuthConfig {
    /** Which auth provider to use */
    authProvider: AuthProviderType;

    /** Which key derivation provider to use */
    keyDerivation: KeyDerivationProviderType;

    /** Server URL for key share operations */
    serverUrl: string;

    /** Whether to automatically send a backup share to the user's email during key setup */
    enableEmailBackupShare: boolean;

    /**
     * Whether phone-only users are required to link an email before proceeding.
     * When true (default), users who authenticate via phone number will see a
     * blocking overlay prompting them to add an email address. This ensures
     * email-based recovery (backup share) is available.
     *
     * Set to false if your deployment intentionally supports phone-only accounts
     * or uses a key derivation strategy that doesn't need email for recovery.
     */
    requireEmailForPhoneUsers: boolean;

    /** Web3Auth client ID from the Web3Auth dashboard */
    web3AuthClientId: string;

    /** Web3Auth network (e.g. 'testnet', 'cyan', 'sapphire_mainnet') */
    web3AuthNetwork: string;

    /** Web3Auth verifier ID (e.g., 'learncardapp-firebase'). Used for migration and Web3Auth strategy. */
    web3AuthVerifierId: string;

    /** Ethereum RPC URL for Web3Auth private key provider (e.g. Infura endpoint) */
    web3AuthRpcTarget: string;
}

// -----------------------------------------------------------------
// TenantConfig override bridge
// -----------------------------------------------------------------

let _authConfigOverrides: Partial<AuthConfig> | null = null;

/**
 * Populate auth config from a TenantConfig.
 *
 * Call this once at app boot, before the auth coordinator initializes.
 * Values set here take priority over environment variables, so existing
 * `getAuthConfig()` callers automatically get tenant-aware values without
 * needing to be refactored.
 */
export const setAuthConfigFromTenant = (tenant: TenantConfig): void => {
    _authConfigOverrides = {
        authProvider: tenant.auth.provider as AuthProviderType,
        keyDerivation: tenant.auth.keyDerivation,
        serverUrl: tenant.auth.sssServerUrl,
        enableEmailBackupShare: tenant.auth.enableEmailBackupShare,
        requireEmailForPhoneUsers: tenant.auth.requireEmailForPhoneUsers,
        web3AuthClientId: tenant.auth.web3Auth?.clientId ?? '',
        web3AuthNetwork: tenant.auth.web3Auth?.network ?? '',
        web3AuthVerifierId: tenant.auth.web3Auth?.verifierId ?? '',
        web3AuthRpcTarget: tenant.auth.web3Auth?.rpcTarget ?? 'https://rpc.ankr.com/eth',
    };
};

/**
 * Set arbitrary partial overrides on the auth config.
 * Values set here take priority over environment variables.
 */
export const setAuthConfigOverrides = (overrides: Partial<AuthConfig>): void => {
    _authConfigOverrides = { ...(_authConfigOverrides ?? {}), ...overrides };
};

/**
 * Clear any overrides — useful for tests.
 */
export const clearAuthConfigOverrides = (): void => {
    _authConfigOverrides = null;
};

// -----------------------------------------------------------------
// Environment variable helpers
// -----------------------------------------------------------------

const getEnvVar = (key: string): string | undefined => {
    // Vite exposes VITE_* env vars from .env files via import.meta.env
    try {
        const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;

        if (metaEnv) {
            const val = metaEnv[key];
            if (val !== undefined) return val;
        }
    } catch {
        // import.meta may not be available in all environments
    }

    // CRA / Node-style
    if (typeof process !== 'undefined' && process.env) {
        const val = process.env[key];
        if (val !== undefined) return val;
    }

    // Runtime injection (e.g. Docker / Vite runtime config)
    if (typeof window !== 'undefined' && (window as Record<string, unknown>).__ENV__) {
        const val = (window as Record<string, unknown> & { __ENV__: Record<string, string> }).__ENV__[key];
        if (val !== undefined) return val;
    }

    return undefined;
};

/**
 * Read an env var with Vite and CRA prefix fallback.
 * e.g. readEnv('AUTH_PROVIDER') checks VITE_AUTH_PROVIDER then REACT_APP_AUTH_PROVIDER.
 */
const readEnv = (suffix: string, legacySuffix?: string): string | undefined => {
    return (
        getEnvVar(`VITE_${suffix}`) ??
        getEnvVar(`REACT_APP_${legacySuffix ?? suffix}`) ??
        undefined
    );
};

/**
 * Get the auth configuration from environment variables.
 * 
 * @example
 * ```ts
 * const config = getAuthConfig();
 * console.log(config.authProvider); // 'firebase'
 * console.log(config.serverUrl);   // 'http://localhost:5100/api'
 * ```
 */
export const getAuthConfig = (): AuthConfig => {
    const authProvider: AuthProviderType =
        _authConfigOverrides?.authProvider ??
        readEnv('AUTH_PROVIDER', 'AUTH_PROVIDER') ?? 'firebase';

    const keyDerivationEnv =
        _authConfigOverrides?.keyDerivation ??
        readEnv('KEY_DERIVATION', 'KEY_DERIVATION_PROVIDER') ?? 'sss';

    const keyDerivation: KeyDerivationProviderType =
        keyDerivationEnv === 'web3auth' ? 'web3auth' : 'sss';

    const serverUrl =
        _authConfigOverrides?.serverUrl ??
        readEnv('SSS_SERVER_URL', 'SSS_SERVER_URL') ?? 'http://localhost:5100/api';

    const enableEmailBackupShareEnv = readEnv('ENABLE_EMAIL_BACKUP_SHARE', 'ENABLE_EMAIL_BACKUP_SHARE');
    const enableEmailBackupShare =
        _authConfigOverrides?.enableEmailBackupShare ??
        (enableEmailBackupShareEnv !== undefined ? enableEmailBackupShareEnv !== 'false' : true);

    const requireEmailEnv = readEnv('REQUIRE_EMAIL_FOR_PHONE_USERS', 'REQUIRE_EMAIL_FOR_PHONE_USERS');
    const requireEmailForPhoneUsers =
        _authConfigOverrides?.requireEmailForPhoneUsers ??
        (requireEmailEnv !== undefined ? requireEmailEnv !== 'false' : true);

    const web3AuthClientId =
        _authConfigOverrides?.web3AuthClientId ??
        readEnv('WEB3AUTH_CLIENT_ID', 'WEB3AUTH_CLIENT_ID') ?? '';

    const web3AuthNetwork =
        _authConfigOverrides?.web3AuthNetwork ??
        readEnv('WEB3AUTH_NETWORK', 'WEB3AUTH_NETWORK') ?? '';

    const web3AuthVerifierId =
        _authConfigOverrides?.web3AuthVerifierId ??
        readEnv('WEB3AUTH_VERIFIER_ID', 'WEB3AUTH_VERIFIER_ID') ?? '';

    const web3AuthRpcTarget =
        _authConfigOverrides?.web3AuthRpcTarget ??
        readEnv('WEB3AUTH_RPC_TARGET', 'WEB3AUTH_RPC_TARGET') ?? 'https://rpc.ankr.com/eth';

    return {
        authProvider,
        keyDerivation,
        serverUrl,
        enableEmailBackupShare,
        requireEmailForPhoneUsers,
        web3AuthClientId,
        web3AuthNetwork,
        web3AuthVerifierId,
        web3AuthRpcTarget,
    };
};

/**
 * Check if the current configuration uses SSS key derivation.
 */
export const shouldUseSSS = (): boolean => {
    return getAuthConfig().keyDerivation === 'sss';
};

/**
 * Default capabilities per strategy name.
 * Used by `getConfigCapabilities()` for pre-auth UI gating (e.g. login page)
 * when no strategy instance is available yet.
 *
 * To add a future strategy, just add an entry here.
 */
const STRATEGY_CAPABILITIES: Record<string, import('@learncard/auth-types').KeyDerivationCapabilities> = {
    sss: { recovery: true, deviceLinking: true, localKeyPersistence: true, contactMethodUpgrade: true },
    web3auth: { recovery: false, deviceLinking: false, localKeyPersistence: false, contactMethodUpgrade: false },
};

const DEFAULT_CAPABILITIES: import('@learncard/auth-types').KeyDerivationCapabilities = {
    recovery: false,
    deviceLinking: false,
    localKeyPersistence: false,
    contactMethodUpgrade: false,
};

/**
 * Get key derivation capabilities from config alone (no strategy instance needed).
 * Useful for pre-auth UI gating (e.g. login page public computer toggle).
 */
export const getConfigCapabilities = (): import('@learncard/auth-types').KeyDerivationCapabilities => {
    const { keyDerivation } = getAuthConfig();

    return STRATEGY_CAPABILITIES[keyDerivation] ?? DEFAULT_CAPABILITIES;
};

/**
 * Check if the email backup share feature is enabled.
 */
export const isEmailBackupShareEnabled = (): boolean => {
    return getAuthConfig().enableEmailBackupShare;
};

export default getAuthConfig;
