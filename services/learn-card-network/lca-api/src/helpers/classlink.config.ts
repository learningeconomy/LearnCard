import { environment } from '@environment';
import {
    DEFAULT_CLASSLINK_TENANT,
    type ClassLinkConfig,
    type ClassLinkTenantConfig,
    type ResolvedTranscriptIssuer,
} from 'types/classlink';
import { parseClassLinkTenants, parseTranscriptIssuers } from './classlinkConfigValidation';

const splitCommaList = (value: string | undefined): string[] =>
    (value ?? '')
        .split(',')
        .map(entry => entry.trim())
        .filter(Boolean);

// Once per container, like services/escrow-enclave/index.ts's remoteConfigMissingReported.
let invalidRegistryWarned = false;
let invalidTenantsWarned = false;
const unknownIssuerWarnings = new Set<string>();

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
