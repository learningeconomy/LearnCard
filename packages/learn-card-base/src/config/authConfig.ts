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
import { tenantKeycloakConfigSchema, type TenantKeycloakConfig } from './tenantConfigSchema';
import type { SSSStrategyConfig, EscrowAttestationPolicy } from '@learncard/sss-key-manager';
import { canonicalEscrowEmailBrand } from '@learncard/sss-key-manager';
import { getLogger } from '../logging/logger';

const log = getLogger('auth-config');

export type DeploymentStage = TenantConfig['stage'];

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

    /**
     * The deploy stage ('local' | 'staging' | 'production'), bridged from `TenantConfig.stage`.
     * Used by the escrow production guard (see `getEscrowStrategyConfig`) to tell a staging
     * deploy apart from production — both build in Vite "production" mode, so `stage` (not
     * `isProductionEnvironment()`) is the signal that distinguishes them. Defaults to
     * 'production' so an isolated consumer that never called `setAuthConfigFromTenant` fails
     * closed.
     */
    stage?: DeploymentStage;

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
    /** The enclave's authority tenant label; unset = the app tenant. See `getEscrowAuthorityTenant`. */
    escrowAuthorityTenant?: string;
    /** D21: seal the app brand into escrow blobs for enclave-sent emails. See `getEscrowStrategyConfig`. */
    escrowSealEmailBrand?: boolean;
    /**
     * D21: display names of the OTHER apps that share this app's DIDs and seal their own brand
     * (LearnCard lists `VetPass`). Only read while `escrowSealEmailBrand` is on, to warn that
     * enclave emails may carry one of those brands. See `getEscrowEmailSender`.
     */
    escrowSharedEmailBrands?: string[];
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
        stage: tenant.stage,
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
        escrowAuthorityTenant: sss.escrowAuthorityTenant as string | undefined,
        escrowSealEmailBrand: (sss.escrowSealEmailBrand as boolean | undefined) ?? false,
        escrowSharedEmailBrands: (sss.escrowSharedEmailBrands as string[] | undefined) ?? [],
        enableEmailBackupShare: (sss.enableEmailBackupShare as boolean | undefined) ?? true,
        requireEmailForPhoneUsers: (sss.requireEmailForPhoneUsers as boolean | undefined) ?? true,
    };

    return {
        authProvider: _authConfigOverrides?.authProvider ?? 'firebase',
        keyDerivation: _authConfigOverrides?.keyDerivation ?? 'sss',
        providerConfig,
        tenantId: _authConfigOverrides?.tenantId,
        stage: _authConfigOverrides?.stage ?? 'production',
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
        ...(sss.escrowAuthorityTenant !== undefined
            ? { escrowAuthorityTenant: sss.escrowAuthorityTenant as string }
            : {}),
        escrowSealEmailBrand: (sss.escrowSealEmailBrand as boolean | undefined) ?? false,
        escrowSharedEmailBrands: (sss.escrowSharedEmailBrands as string[] | undefined) ?? [],
        enableEmailBackupShare: (sss.enableEmailBackupShare as boolean) ?? true,
        requireEmailForPhoneUsers: (sss.requireEmailForPhoneUsers as boolean) ?? true,
    };
};

/** Read the validated Keycloak block supplied by the tenant, when configured. */
export const getKeycloakConfig = (): TenantKeycloakConfig | undefined => {
    const { keycloak } = getAuthConfig().providerConfig;
    return keycloak ? tenantKeycloakConfigSchema.parse(keycloak) : undefined;
};

/**
 * Check if the current configuration uses SSS key derivation.
 */
export const shouldUseSSS = (): boolean => {
    return getAuthConfig().keyDerivation === 'sss';
};

// -----------------------------------------------------------------
// Escrow authority tenant
// -----------------------------------------------------------------

const ESCROW_AUTHORITY_TENANT_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

/**
 * The tenant label the escrow enclave signs and verifies: `escrowAuthorityTenant` when the
 * tenant config sets it (VetPass shares LearnCard's single-tenant enclave, `"learncard"`),
 * otherwise the app tenant, otherwise `"learncard"` (the strategy's own default).
 */
export const getEscrowAuthorityTenant = (
    sss: Pick<SSSConfig, 'escrowAuthorityTenant'>,
    tenantId: string | undefined = getAuthConfig().tenantId
): string => sss.escrowAuthorityTenant ?? tenantId ?? 'learncard';

/**
 * The FALLBACK brand the enclave puts on the emails it sends itself (one-time code, recovery
 * started, release warning) for blobs with no owner-sealed brand (D21: blobs enrolled before
 * `escrowSealEmailBrand`, by the other app sharing the DID, or with sealing off). Mirrors
 * `brand_name` in escrow-enclave-app/src/authority/email.rs, which brands from the measured
 * authority label — keep the two in sync.
 */
export const escrowAuthorityBrandName = (authorityTenant: string): string => {
    if (authorityTenant === 'learncard') return 'LearnCard';
    if (authorityTenant === 'scouts') return 'ScoutPass';
    return authorityTenant;
};

/**
 * The sender brand to name in the in-app "we'll email you from X" note, or `undefined`
 * when the enclave's emails already carry this app's brand (no note needed).
 */
export const getEscrowEmailSenderBrand = (
    appBrandName: string | undefined,
    authorityTenant: string
): string | undefined => {
    const sender = escrowAuthorityBrandName(authorityTenant);
    return appBrandName && sender !== appBrandName ? sender : undefined;
};

/**
 * The in-app "who will email you" note for the escrow enclave's own emails:
 *  - `sender`: the other brand the email may carry; `brand`: this app's `branding.name`.
 *  - `mixed`: the email may carry either brand (D21: this app seals its own brand, but the
 *    stored blob may predate that or have been written by another app on a shared DID).
 *  - `shared`: `sender` is another app sharing the user's account (from
 *    `escrowSharedEmailBrands`), not the service that secures this app's account.
 */
export interface EscrowEmailSenderNote {
    sender: string;
    brand: string;
    mixed: boolean;
    shared?: boolean;
}

/**
 * Option A for apps sharing another tenant's escrow enclave (VetPass on LearnCard's): who the
 * enclave-sent emails come from, or `undefined` when they can only carry this app's brand.
 *
 * D21: with `escrowSealEmailBrand` on (and a sealable brand name), new enrollments seal this
 * app's brand, but the client cannot read which brand the stored blob carries (it is sealed,
 * and may predate the flag or come from another app on a shared DID, "last writer wins"), so
 * the note says the email may come from either (`mixed: true`). It is never hidden while such
 * blobs can exist:
 *  - an app whose authority brand differs (VetPass) names the authority brand (`LearnCard`);
 *  - an app whose authority brand IS its own (LearnCard) names the co-tenant apps listed in
 *    `escrowSharedEmailBrands` (`VetPass`), which may have sealed their brand on a shared DID.
 */
export const getEscrowEmailSender = (
    tenant: { tenantId?: string; branding?: { name?: string } },
    sss: Pick<
        SSSConfig,
        'escrowAuthorityTenant' | 'escrowSealEmailBrand' | 'escrowSharedEmailBrands'
    >
): EscrowEmailSenderNote | undefined => {
    const brand = tenant.branding?.name;
    if (!brand) return undefined;
    const sealing = !!sss.escrowSealEmailBrand && canonicalEscrowEmailBrand(brand) !== undefined;
    const sender = getEscrowEmailSenderBrand(brand, getEscrowAuthorityTenant(sss, tenant.tenantId));
    if (sender) return { sender, brand, mixed: sealing };
    if (!sealing) return undefined;
    const others = [...new Set(sss.escrowSharedEmailBrands ?? [])].filter(
        other => other.trim() !== '' && other !== brand
    );
    return others.length > 0
        ? { sender: others.join(' / '), brand, mixed: true, shared: true }
        : undefined;
};

/** Overrides for `getEscrowStrategyConfig`'s production guard — for tests only. */
export interface EscrowProdGuardOptions {
    /** Defaults to `getAuthConfig().tenantId`. */
    tenantId?: string;
    /**
     * Defaults to `getAuthConfig().stage`. Anything other than exactly 'staging' or 'local'
     * (including an unrecognized string or omission) is treated as 'production' — fail-closed.
     */
    stage?: DeploymentStage;
    /**
     * D21: the app's display name (`branding.name`), sealed into escrow blobs as the enclave
     * email brand when `sss.escrowSealEmailBrand` is on. An unsealable name logs and is
     * omitted (emails keep the authority tenant's brand); it never disables escrow.
     */
    appBrandName?: string;
}

/**
 * Map the tenant's explicit trust policy to the escrow strategy configuration.
 *
 * Two fail-closed guards apply before a policy is returned:
 *  - `nitro` with zero PCR-tuple pins (empty, or only legacy `{ imageSha384 }` pins) disables
 *    escrow entirely, since no attestation could ever match.
 *  - `software` is never allowed for a production tenant on a production deploy — the
 *    host-trusted software enclave must not run in production; it is downgraded to `off`
 *    instead. Staging deliberately runs it (see D12 in `services/escrow-enclave-app/SECURITY.md`),
 *    so the guard keys on the deploy *stage*, not the Vite build mode (staging is also built in
 *    Vite "production" mode).
 * Both guards log via `log.error` so a misconfigured tenant is loud, not silent.
 *
 * D21: `emailBrand` is set from `options.appBrandName` only when `sss.escrowSealEmailBrand` is
 * on and the name passes `canonicalEscrowEmailBrand`; otherwise it is omitted (logged).
 */
export const getEscrowStrategyConfig = (
    sss: SSSConfig,
    options: EscrowProdGuardOptions = {}
): SSSStrategyConfig['escrow'] => {
    if (sss.escrowEnclaveMode === 'off') return undefined;

    const tenantId = options.tenantId ?? getAuthConfig().tenantId;
    const stage = options.stage ?? getAuthConfig().stage;
    const isProductionDeploy = stage !== 'staging' && stage !== 'local';

    if (
        sss.escrowAuthorityTenant !== undefined &&
        !ESCROW_AUTHORITY_TENANT_PATTERN.test(sss.escrowAuthorityTenant)
    ) {
        log.error('escrow.authority-tenant.invalid', { tenantId });
        return undefined;
    }
    // Only an explicit setting is forwarded; unset keeps the strategy's app-tenant default.
    // D21: the sealed email brand rides along with it (display text only, never a reason
    // to disable escrow).
    const emailBrand = sss.escrowSealEmailBrand
        ? canonicalEscrowEmailBrand(options.appBrandName)
        : undefined;
    if (sss.escrowSealEmailBrand && emailBrand === undefined)
        log.error('escrow.email-brand.invalid', { tenantId });
    const authorityTenant = {
        ...(sss.escrowAuthorityTenant !== undefined
            ? { authorityTenant: sss.escrowAuthorityTenant }
            : {}),
        ...(emailBrand !== undefined ? { emailBrand } : {}),
    };

    if (sss.escrowEnclaveMode === 'software') {
        if (isProductionDeploy && isProductionTenant(tenantId)) {
            log.error('escrow.software-mode.blocked-in-production', { tenantId, stage });
            return undefined;
        }

        return {
            enabled: true,
            attestation: { mode: 'software', pinnedPublicKeys: sss.escrowEnclavePublicKeys },
            ...authorityTenant,
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
        ...authorityTenant,
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

/**
 * Whether emailed recovery keys can be sent: the client must encrypt them to the
 * relay's pinned public key, so without one the Email method cannot work.
 */
export const isEmailRelayConfigured = (sss: SSSConfig = getSSSConfig()): boolean =>
    sss.escrowRelayPublicKey.trim().length > 0 &&
    /^[A-Za-z0-9._-]{1,128}$/.test(sss.escrowRelayKeyId.trim());

/**
 * The escrow strategy config for the resolved tenant, as the apps' `sss` key-derivation
 * factories build it: D21 seals the tenant's `branding.name` as the enclave email brand
 * (when `sss.escrowSealEmailBrand` is on). `tenant` is `undefined` when the tenant config could
 * not be resolved; nothing is sealed then. One shared helper so the wiring is tested once.
 */
export const getTenantEscrowStrategyConfig = (
    sss: SSSConfig,
    tenant: { branding?: { name?: string } } | undefined,
    options: Omit<EscrowProdGuardOptions, 'appBrandName'> = {}
): SSSStrategyConfig['escrow'] =>
    getEscrowStrategyConfig(sss, { ...options, appBrandName: tenant?.branding?.name });
