/**
 * Auth configuration is resolved from validated TenantConfig during application bootstrap.
 * Consumers never read deployment environment variables directly.
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
 *
 * The validated tenant config is the sole deployment-specific auth source.
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
    const knownKeys = new Set(['provider', 'keyDerivation', 'firebase', 'sss', 'web3Auth']);

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
 * Set arbitrary partial overrides for tests or embedding hosts that provide validated config.
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

/**
 * Get the current auth configuration.
 *
 * TenantConfig overrides are installed before application auth starts. The defaults below
 * keep isolated package consumers and tests deterministic without introducing another
 * configuration source.
 */
export const getAuthConfig = (): AuthConfig => {
    const providerConfig = _authConfigOverrides?.providerConfig
        ? { ..._authConfigOverrides.providerConfig }
        : {};
    const sss = providerConfig.sss ?? {};

    providerConfig.sss = {
        ...sss,
        serverUrl: (sss.serverUrl as string | undefined) ?? 'http://localhost:5100/api',
        enableEmailBackupShare: (sss.enableEmailBackupShare as boolean | undefined) ?? true,
        requireEmailForPhoneUsers: (sss.requireEmailForPhoneUsers as boolean | undefined) ?? true,
    };

    return {
        authProvider: _authConfigOverrides?.authProvider ?? 'firebase',
        keyDerivation: _authConfigOverrides?.keyDerivation ?? 'sss',
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
const STRATEGY_CAPABILITIES: Record<string, import('@learncard/types').KeyDerivationCapabilities> =
    {
        sss: {
            recovery: true,
            deviceLinking: true,
            localKeyPersistence: true,
            contactMethodUpgrade: true,
        },
        web3auth: {
            recovery: false,
            deviceLinking: false,
            localKeyPersistence: false,
            contactMethodUpgrade: false,
        },
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
