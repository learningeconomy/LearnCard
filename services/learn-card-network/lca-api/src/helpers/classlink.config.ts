import { environment } from '@environment';
import {
    ACCOUNT_CONTINUITY_CODE_DEFAULT,
    ACCOUNT_CONTINUITY_OFF,
    AccountContinuityOverrideValidator,
    type AccountContinuityPolicy,
    type AccountContinuitySettings,
} from 'types/accountContinuity';
import {
    DEFAULT_CLASSLINK_TENANT,
    type ClassLinkConfig,
    type ClassLinkTenantConfig,
    type ResolvedTranscriptIssuer,
} from 'types/classlink';
import {
    parseAccountContinuityDefault,
    parseClassLinkTenants,
    parseTranscriptIssuers,
} from './classlinkConfigValidation';

const splitCommaList = (value: string | undefined): string[] =>
    (value ?? '')
        .split(',')
        .map(entry => entry.trim())
        .filter(Boolean);

// Once per container, like services/escrow-enclave/index.ts's remoteConfigMissingReported.
let invalidRegistryWarned = false;
let invalidTenantsWarned = false;
const unknownIssuerWarnings = new Set<string>();
let invalidContinuityDefaultWarned = false;
const invalidContinuityTenantWarnings = new Set<string>();

/**
 * Parse the account-continuity layers. Never throws, so ClassLink sign-in is never affected.
 * An invalid env default is replaced by `{personalEmail:"off"}` over the code default; a
 * district whose own `accountContinuity` sets `personalEmail` still uses its own value. An
 * invalid district value turns personal email off for that district only.
 */
const getAccountContinuitySettings = (
    tenants: ClassLinkConfig['tenants']
): AccountContinuitySettings => {
    let defaultPolicy: AccountContinuityPolicy;
    try {
        defaultPolicy = parseAccountContinuityDefault(
            environment.CLASSLINK_ACCOUNT_CONTINUITY_DEFAULT
        );
    } catch {
        if (!invalidContinuityDefaultWarned) {
            invalidContinuityDefaultWarned = true;
            console.warn('CLASSLINK_ACCOUNT_CONTINUITY_DEFAULT is invalid; personal email is off');
        }
        defaultPolicy = { ...ACCOUNT_CONTINUITY_CODE_DEFAULT, ...ACCOUNT_CONTINUITY_OFF };
    }
    const overrides: AccountContinuitySettings['tenants'] = {};
    for (const [tenantId, tenant] of Object.entries(tenants)) {
        if (tenant.accountContinuity === undefined) continue;
        const parsed = AccountContinuityOverrideValidator.safeParse(tenant.accountContinuity);
        if (!parsed.success && !invalidContinuityTenantWarnings.has(tenantId)) {
            invalidContinuityTenantWarnings.add(tenantId);
            console.warn('classlink.continuity.invalid_district', { tenantId });
        }
        overrides[tenantId] = parsed.success ? parsed.data : ACCOUNT_CONTINUITY_OFF;
    }
    return {
        enabled: environment.CLASSLINK_ACCOUNT_CONTINUITY_ENABLED,
        defaultPolicy,
        tenants: overrides,
    };
};

/**
 * Every configured transcript issuer, keyed by TRANSCRIPT_ISSUERS key.
 * Never throws: any problem with TRANSCRIPT_ISSUERS is logged
 * and the whole value is dropped, so one typo can't take down every district's transcript flow.
 */
const getTranscriptIssuerRegistry = (): Record<string, ResolvedTranscriptIssuer> => {
    const registry: Record<string, ResolvedTranscriptIssuer> = {};

    if (environment.TRANSCRIPT_ISSUERS) {
        try {
            const parsed = parseTranscriptIssuers(
                environment.TRANSCRIPT_ISSUERS,
                environment.NODE_ENV
            );
            for (const [key, issuer] of Object.entries(parsed)) registry[key] = { key, ...issuer };
        } catch {
            if (!invalidRegistryWarned) {
                invalidRegistryWarned = true;
                console.warn('TRANSCRIPT_ISSUERS is invalid and will be ignored');
            }
        }
    }

    return registry;
};

export const getClassLinkConfig = (): ClassLinkConfig | null => {
    const clientId = environment.CLASSLINK_CLIENT_ID;
    const clientSecret = environment.CLASSLINK_CLIENT_SECRET;
    const tenantsJson = environment.CLASSLINK_TENANTS;

    if (!clientId || !clientSecret) return null;

    // CLASSLINK_TENANTS is optional: it only holds per-district overrides.
    let tenants: ClassLinkConfig['tenants'];
    try {
        tenants = parseClassLinkTenants(tenantsJson);
    } catch {
        if (!invalidTenantsWarned) {
            invalidTenantsWarned = true;
            console.warn('ClassLink configuration disabled: CLASSLINK_TENANTS is invalid');
        }
        return null;
    }

    const transcriptIssuers = getTranscriptIssuerRegistry();
    for (const tenant of Object.values(tenants)) {
        if (tenant.transcriptIssuer && !Object.hasOwn(transcriptIssuers, tenant.transcriptIssuer)) {
            if (!unknownIssuerWarnings.has(tenant.transcriptIssuer)) {
                unknownIssuerWarnings.add(tenant.transcriptIssuer);
                console.warn(
                    'ClassLink transcripts disabled: unknown issuer key',
                    tenant.transcriptIssuer
                );
            }
            tenant.transcriptEnabled = false;
        }
    }

    return {
        clientId,
        clientSecret,
        discoveryUrl: environment.CLASSLINK_DISCOVERY_URL,
        redirectUris: splitCommaList(environment.CLASSLINK_REDIRECT_URIS),
        tenants,
        maxAuthAgeSeconds: environment.CLASSLINK_MAX_AUTH_AGE_SECONDS,
        accountContinuity: getAccountContinuitySettings(tenants),
    };
};

/**
 * Every district that signs in through our ClassLink app is accepted (ClassLink signs the
 * id_token for our client ID). Districts listed in CLASSLINK_TENANTS get their overrides;
 * all others get DEFAULT_CLASSLINK_TENANT.
 */
export const getClassLinkTenant = (
    config: Pick<ClassLinkConfig, 'tenants'>,
    tenantId: string
): ClassLinkTenantConfig =>
    Object.hasOwn(config.tenants, tenantId) ? config.tenants[tenantId]! : DEFAULT_CLASSLINK_TENANT;

/**
 * Resolves a district's transcript issuer: `tenant.transcriptIssuer` selects a TRANSCRIPT_ISSUERS
 * key, defaulting to the `default` entry in TRANSCRIPT_ISSUERS.
 * Returns null when no matching issuer is configured.
 */
export const getTranscriptIssuerConfig = (
    tenant?: { transcriptIssuer?: string } | null
): ResolvedTranscriptIssuer | null => {
    const key = tenant?.transcriptIssuer ?? 'default';
    return getTranscriptIssuerRegistry()[key] ?? null;
};
