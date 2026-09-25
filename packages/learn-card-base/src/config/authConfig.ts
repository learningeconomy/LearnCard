/**
 * Auth configuration is resolved from validated TenantConfig during application bootstrap.
 *
 * One exception: the escrow enclave trust policy (`VITE_ESCROW_ENCLAVE_MODE`,
 * `VITE_ESCROW_ENCLAVE_PUBLIC_KEYS`) may be supplied through `import.meta.env`
 * so local / preview builds can pin a software enclave without editing tenant
 * JSON. Explicit tenant values always take precedence over these fallbacks, and
 * this is the only place in `learn-card-base` that reads `import.meta.env`, so
 * the package stays buildable outside Vite as long as the reference is optional.
 */

import type { AuthProviderType } from '../auth-coordinator/types';
import type { TenantConfig } from './tenantConfig';
import type { SSSStrategyConfig, EscrowAttestationPolicy } from '@learncard/sss-key-manager';
import { getLogger } from '../logging/logger';
import { isProductionEnvironment } from './isProduction';

const log = getLogger('auth-config');

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

    /** The active tenant's id, used by the escrow production guard (see `isProductionTenant`). */
    tenantId?: string;

    /** Staged rollout percentage (0-100) for automatic escrow enrollment. See `escrowRollout.ts`. */
    escrowRolloutPercent?: number;

    /** SHA-256 hex hashes of allowlisted stable user identifiers. See `escrowRollout.ts`. */
    escrowRolloutAllowlist?: string[];
}

type NitroEscrowPolicy = Extract<EscrowAttestationPolicy, { mode: 'nitro' }>;

/** A single nitro measurement pin — either a full PCR0/1/2 tuple or a legacy image-only pin. */
export type EscrowMeasurementPin = NitroEscrowPolicy['pinnedMeasurements'][number];

/**
 * Typed SSS key-derivation strategy config.
 * Extracted from `providerConfig.sss` via `getSSSConfig()`.
 */
export interface SSSConfig {
    serverUrl: string;
    escrowRelayPublicKey: string;
    escrowRelayKeyId: string;
    escrowEnclaveMode: 'off' | 'software' | 'nitro';
    escrowEnclavePublicKeys: string[];
    escrowEnclaveMeasurements: EscrowMeasurementPin[];
    escrowEnclaveRootSha256?: string;
    escrowEnclaveMaxAgeMs?: number;
    enableEmailBackupShare: boolean;
    requireEmailForPhoneUsers: boolean;
}

// -----------------------------------------------------------------
// Escrow production guard
// -----------------------------------------------------------------

/**
 * Tenants deployed to production. Kept as an explicit allowlist (rather than derived from
 * `environments/*` at runtime, which isn't available to a browser package) — add a tenant here
 * when it ships a production `environments/<tenant>/config.json` that isn't a local-only stage.
 */
export const PRODUCTION_TENANT_IDS: ReadonlySet<string> = new Set([
    'learncard',
    'vetpass',
    'scoutpass',
]);

export const isProductionTenant = (tenantId: string | undefined): boolean =>
    !!tenantId && PRODUCTION_TENANT_IDS.has(tenantId);

/** True only for a pin that can ever match an attestation (see `escrow-nitro-attestation.ts`). */
export const isPcrPinnedMeasurement = (pin: EscrowMeasurementPin): boolean =>
    typeof pin.pcr0 === 'string' && typeof pin.pcr1 === 'string' && typeof pin.pcr2 === 'string';

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
        tenantId: tenant.tenantId,
        escrowRolloutPercent: tenant.features.escrowRolloutPercent,
        escrowRolloutAllowlist: tenant.features.escrowRolloutAllowlist,
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
    const env = import.meta.env;
    const enclaveMode = env?.VITE_ESCROW_ENCLAVE_MODE;

    providerConfig.sss = {
        ...sss,
        serverUrl: (sss.serverUrl as string | undefined) ?? 'http://localhost:5100/api',
        escrowRelayPublicKey: (sss.escrowRelayPublicKey as string | undefined) ?? '',
        escrowRelayKeyId: (sss.escrowRelayKeyId as string | undefined) ?? '',
        escrowEnclaveMode:
            sss.escrowEnclaveMode ??
            (enclaveMode === 'software' || enclaveMode === 'nitro' ? enclaveMode : 'off'),
        escrowEnclavePublicKeys:
            sss.escrowEnclavePublicKeys ??
            env?.VITE_ESCROW_ENCLAVE_PUBLIC_KEYS?.split(',')
                .map((key: string) => key.trim())
                .filter(Boolean) ??
            [],
        escrowEnclaveMeasurements: sss.escrowEnclaveMeasurements ?? [],
        escrowEnclaveRootSha256: sss.escrowEnclaveRootSha256 as string | undefined,
        escrowEnclaveMaxAgeMs: sss.escrowEnclaveMaxAgeMs as number | undefined,
        enableEmailBackupShare: (sss.enableEmailBackupShare as boolean | undefined) ?? true,
        requireEmailForPhoneUsers: (sss.requireEmailForPhoneUsers as boolean | undefined) ?? true,
    };

    return {
        authProvider: _authConfigOverrides?.authProvider ?? 'firebase',
        keyDerivation: _authConfigOverrides?.keyDerivation ?? 'sss',
        providerConfig,
        tenantId: _authConfigOverrides?.tenantId,
        escrowRolloutPercent: _authConfigOverrides?.escrowRolloutPercent ?? 0,
        escrowRolloutAllowlist: _authConfigOverrides?.escrowRolloutAllowlist ?? [],
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
        escrowRelayPublicKey: (sss.escrowRelayPublicKey as string) ?? '',
        escrowRelayKeyId: (sss.escrowRelayKeyId as string) ?? '',
        escrowEnclaveMode: (sss.escrowEnclaveMode as SSSConfig['escrowEnclaveMode']) ?? 'off',
        escrowEnclavePublicKeys: (sss.escrowEnclavePublicKeys as string[]) ?? [],
        escrowEnclaveMeasurements:
            (sss.escrowEnclaveMeasurements as SSSConfig['escrowEnclaveMeasurements']) ?? [],
        escrowEnclaveRootSha256: sss.escrowEnclaveRootSha256 as string | undefined,
        escrowEnclaveMaxAgeMs: sss.escrowEnclaveMaxAgeMs as number | undefined,
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

/** Overrides for `getEscrowStrategyConfig`'s production guard — for tests only. */
export interface EscrowProdGuardOptions {
    /** Defaults to `getAuthConfig().tenantId`. */
    tenantId?: string;
    /** Defaults to `isProductionEnvironment()`. */
    isProductionBuild?: boolean;
}

/**
 * Map the tenant's explicit trust policy to the escrow strategy configuration.
 *
 * Two fail-closed guards apply before a policy is returned:
 *  - `nitro` with zero PCR-tuple pins (empty, or only legacy `{ imageSha384 }` pins) disables
 *    escrow entirely, since no attestation could ever match.
 *  - `software` is never allowed for a production tenant in a production build — the host-trusted
 *    software enclave must not run in production; it is downgraded to `off` instead.
 * Both guards log via `log.error` so a misconfigured tenant is loud, not silent.
 */
export const getEscrowStrategyConfig = (
    sss: SSSConfig,
    options: EscrowProdGuardOptions = {}
): SSSStrategyConfig['escrow'] => {
    if (sss.escrowEnclaveMode === 'off') return undefined;

    const tenantId = options.tenantId ?? getAuthConfig().tenantId;
    const isProductionBuild = options.isProductionBuild ?? isProductionEnvironment();

    if (sss.escrowEnclaveMode === 'software') {
        if (isProductionBuild && isProductionTenant(tenantId)) {
            log.error('escrow.software-mode.blocked-in-production', { tenantId });
            return undefined;
        }

        return {
            enabled: true,
            attestation: { mode: 'software', pinnedPublicKeys: sss.escrowEnclavePublicKeys },
        };
    }

    const pcrPins = sss.escrowEnclaveMeasurements.filter(isPcrPinnedMeasurement);

    if (pcrPins.length === 0) {
        log.error('escrow.nitro-mode.no-pcr-pins', { tenantId });
        return undefined;
    }

    return {
        enabled: true,
        attestation: {
            mode: 'nitro',
            pinnedMeasurements: sss.escrowEnclaveMeasurements,
            rootCertificateSha256: sss.escrowEnclaveRootSha256,
            maxAgeMs: sss.escrowEnclaveMaxAgeMs,
        },
    };
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
