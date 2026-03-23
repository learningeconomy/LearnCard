/**
 * Auth Configuration
 *
 * Environment-driven configuration for the auth coordinator.
 * Reads from environment variables with sensible defaults.
 *
 * For each key the lookup order is: tenant config override → VITE_ prefix → REACT_APP_ prefix → default.
 *
 * Environment Variables:
 *   VITE_AUTH_PROVIDER / REACT_APP_AUTH_PROVIDER                             — 'firebase' (default)
 *   VITE_KEY_DERIVATION / REACT_APP_KEY_DERIVATION_PROVIDER                  — 'sss' (default)
 *   VITE_SSS_SERVER_URL / REACT_APP_SSS_SERVER_URL                           — mapped to providerConfig.sss.serverUrl
 *   VITE_ENABLE_EMAIL_BACKUP_SHARE / REACT_APP_ENABLE_EMAIL_BACKUP_SHARE     — mapped to providerConfig.sss.enableEmailBackupShare
 *   VITE_REQUIRE_EMAIL_FOR_PHONE_USERS / REACT_APP_REQUIRE_EMAIL_FOR_PHONE_USERS — mapped to providerConfig.sss.requireEmailForPhoneUsers
 *   VITE_WEB3AUTH_CLIENT_ID / VITE_WEB3AUTH_NETWORK / VITE_WEB3AUTH_VERIFIER_ID / VITE_WEB3AUTH_RPC_TARGET
 *     — mapped to providerConfig.web3Auth
 *
 * For self-hosting, set these in your .env file or deployment environment.
 */

import type { AuthProviderType } from '../auth-coordinator/types';
import type { TenantConfig } from './tenantConfig';

export interface AuthConfig {
    /** Which auth provider to use (open string matching providerRegistry factories) */
    authProvider: AuthProviderType;

    /** Which key derivation strategy to use (open string matching providerRegistry factories) */
    keyDerivation: string;

    /**
     * Provider- and strategy-specific config blocks from the tenant config.
     *
     * Each key is a provider/strategy name (e.g. 'firebase', 'sss', 'web3Auth', 'keycloak').
     * Factory functions in providerRegistry read their own block.
     * This keeps AuthConfig fully agnostic — adding a new provider or strategy
     * doesn't require changing this interface.
     *
     * Use the typed helpers (`getSSSConfig()`, etc.) for ergonomic access.
     */
    providerConfig: Record<string, Record<string, unknown>>;
}

/**
 * Typed SSS key-derivation strategy config.
 * Extracted from `providerConfig.sss` via `getSSSConfig()`.
 */
export interface SSSConfig {
    serverUrl: string;
    enableEmailBackupShare: boolean;
    requireEmailForPhoneUsers: boolean;
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
    // Build providerConfig from the tenant's provider- and strategy-specific blocks.
    // Each named block (firebase, sss, web3Auth, keycloak, etc.) is passed through.
    const providerConfig: Record<string, Record<string, unknown>> = {};

    // Explicitly typed blocks
    if (tenant.auth.firebase) {
        providerConfig.firebase = tenant.auth.firebase as Record<string, unknown>;
    }

    if (tenant.auth.sss) {
        providerConfig.sss = tenant.auth.sss as Record<string, unknown>;
    }

    if (tenant.auth.web3Auth) {
        providerConfig.web3Auth = tenant.auth.web3Auth as Record<string, unknown>;
    }

    // Forward any other provider blocks that arrived via .passthrough()
    const knownKeys = new Set([
        'provider', 'keyDerivation',
        'firebase', 'sss', 'web3Auth',
    ]);

    for (const [key, value] of Object.entries(tenant.auth)) {
        if (!knownKeys.has(key) && value && typeof value === 'object' && !Array.isArray(value)) {
            providerConfig[key] = value as Record<string, unknown>;
        }
    }

    _authConfigOverrides = {
        authProvider: tenant.auth.provider as AuthProviderType,
        keyDerivation: tenant.auth.keyDerivation,
        providerConfig,
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
 * Get the auth configuration from environment variables and tenant overrides.
 * 
 * @example
 * ```ts
 * const config = getAuthConfig();
 * console.log(config.authProvider);   // 'firebase'
 * console.log(config.keyDerivation);  // 'sss'
 *
 * const sss = getSSSConfig();
 * console.log(sss.serverUrl);         // 'http://localhost:5100/api'
 * ```
 */
export const getAuthConfig = (): AuthConfig => {
    const authProvider: AuthProviderType =
        _authConfigOverrides?.authProvider ??
        readEnv('AUTH_PROVIDER', 'AUTH_PROVIDER') ?? 'firebase';

    const keyDerivation: string =
        _authConfigOverrides?.keyDerivation ??
        readEnv('KEY_DERIVATION', 'KEY_DERIVATION_PROVIDER') ?? 'sss';

    // Build providerConfig — tenant overrides take priority, env vars as fallback.
    const providerConfig: Record<string, Record<string, unknown>> =
        _authConfigOverrides?.providerConfig
            ? { ..._authConfigOverrides.providerConfig }
            : {};

    // Legacy SSS env var fallback (only if no tenant override provided sss)
    if (!providerConfig.sss) {
        const serverUrl = readEnv('SSS_SERVER_URL', 'SSS_SERVER_URL') ?? 'http://localhost:5100/api';

        const enableEmailBackupShareEnv = readEnv('ENABLE_EMAIL_BACKUP_SHARE', 'ENABLE_EMAIL_BACKUP_SHARE');
        const enableEmailBackupShare = enableEmailBackupShareEnv !== undefined
            ? enableEmailBackupShareEnv !== 'false'
            : true;

        const requireEmailEnv = readEnv('REQUIRE_EMAIL_FOR_PHONE_USERS', 'REQUIRE_EMAIL_FOR_PHONE_USERS');
        const requireEmailForPhoneUsers = requireEmailEnv !== undefined
            ? requireEmailEnv !== 'false'
            : true;

        providerConfig.sss = { serverUrl, enableEmailBackupShare, requireEmailForPhoneUsers };
    }

    // Legacy Web3Auth env var fallback (only if no tenant override provided web3Auth)
    if (!providerConfig.web3Auth) {
        const clientId = readEnv('WEB3AUTH_CLIENT_ID', 'WEB3AUTH_CLIENT_ID') ?? '';
        const network = readEnv('WEB3AUTH_NETWORK', 'WEB3AUTH_NETWORK') ?? '';
        const verifierId = readEnv('WEB3AUTH_VERIFIER_ID', 'WEB3AUTH_VERIFIER_ID') ?? '';
        const rpcTarget = readEnv('WEB3AUTH_RPC_TARGET', 'WEB3AUTH_RPC_TARGET') ?? 'https://cloudflare-eth.com';

        if (clientId || network || verifierId) {
            providerConfig.web3Auth = { clientId, network, verifierId, rpcTarget };
        }
    }

    return {
        authProvider,
        keyDerivation,
        providerConfig,
    };
};

/**
 * Get the SSS key-derivation strategy config with proper types.
 *
 * Reads from `providerConfig.sss`, falling back to sensible defaults.
 * This is the ergonomic way to access SSS-specific config in consumers.
 */
export const getSSSConfig = (): SSSConfig => {
    const { providerConfig } = getAuthConfig();
    const sss = providerConfig.sss ?? {};

    return {
        serverUrl: (sss.serverUrl as string) ?? 'http://localhost:5100/api',
        enableEmailBackupShare: (sss.enableEmailBackupShare as boolean) ?? true,
        requireEmailForPhoneUsers: (sss.requireEmailForPhoneUsers as boolean) ?? true,
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
const STRATEGY_CAPABILITIES: Record<string, import('@learncard/types').KeyDerivationCapabilities> = {
    sss: { recovery: true, deviceLinking: true, localKeyPersistence: true, contactMethodUpgrade: true },
    web3auth: { recovery: false, deviceLinking: false, localKeyPersistence: false, contactMethodUpgrade: false },
};

const DEFAULT_CAPABILITIES: import('@learncard/types').KeyDerivationCapabilities = {
    recovery: false,
    deviceLinking: false,
    localKeyPersistence: false,
    contactMethodUpgrade: false,
};

/**
 * Get key derivation capabilities from config alone (no strategy instance needed).
 * Useful for pre-auth UI gating (e.g. login page public computer toggle).
 */
export const getConfigCapabilities = (): import('@learncard/types').KeyDerivationCapabilities => {
    const { keyDerivation } = getAuthConfig();

    return STRATEGY_CAPABILITIES[keyDerivation] ?? DEFAULT_CAPABILITIES;
};

/**
 * Check if the email backup share feature is enabled.
 */
export const isEmailBackupShareEnabled = (): boolean => {
    return getSSSConfig().enableEmailBackupShare;
};

export default getAuthConfig;
