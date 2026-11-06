import { environment } from '@environment';
import {
    ClassLinkTenantsValidator,
    DEFAULT_CLASSLINK_TENANT,
    TranscriptIssuerValidator,
    TranscriptIssuersValidator,
    type ClassLinkConfig,
    type ClassLinkTenantConfig,
    type ResolvedTranscriptIssuer,
} from 'types/classlink';

const splitCommaList = (value: string | undefined): string[] =>
    (value ?? '')
        .split(',')
        .map(entry => entry.trim())
        .filter(Boolean);

const LOCAL_HTTP_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);
const stripBrackets = (hostname: string): string => hostname.replace(/^\[|\]$/g, '');

/**
 * https is always allowed. http is only allowed to localhost/127.0.0.1/::1, and only outside
 * production, so a misconfigured endpoint can never receive a signed assertion (it carries a
 * state student ID) over plaintext in production. Unparseable URLs are rejected.
 */
const isAllowedTranscriptIssuerEndpoint = (url: string): boolean => {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return false;
    }
    if (parsed.protocol === 'https:') return true;
    if (parsed.protocol === 'http:') {
        return (
            LOCAL_HTTP_HOSTNAMES.has(stripBrackets(parsed.hostname)) &&
            environment.NODE_ENV !== 'production'
        );
    }
    return false;
};

// Once per container, like services/escrow-enclave/index.ts's remoteConfigMissingReported.
let explicitDefaultOverridesLegacyWarned = false;
let invalidLegacyIssuerWarned = false;
let invalidRegistryWarned = false;
let invalidTenantsWarned = false;
const unknownIssuerWarnings = new Set<string>();

/**
 * Every configured transcript issuer, keyed by TRANSCRIPT_ISSUERS key (or `default` for the
 * legacy TRANSCRIPT_ISSUER_* vars). Never throws: any problem with TRANSCRIPT_ISSUERS is logged
 * and the whole value is dropped, so one typo can't take down every district's transcript flow.
 */
const getTranscriptIssuerRegistry = (): Record<string, ResolvedTranscriptIssuer> => {
    const registry: Record<string, ResolvedTranscriptIssuer> = {};
    const legacyEndpoint = environment.TRANSCRIPT_ISSUER_ENDPOINT;
    const legacyAudience = environment.TRANSCRIPT_ISSUER_AUDIENCE;
    let hasLegacyDefault = false;

    if (legacyEndpoint && legacyAudience) {
        // Same checks as TRANSCRIPT_ISSUERS entries, except `did` stays optional here.
        const legacy = TranscriptIssuerValidator.partial({ did: true }).safeParse({
            endpoint: legacyEndpoint,
            audience: legacyAudience,
            ...(environment.TRANSCRIPT_ISSUER_DID
                ? { did: environment.TRANSCRIPT_ISSUER_DID }
                : {}),
        });
        if (legacy.success && isAllowedTranscriptIssuerEndpoint(legacy.data.endpoint)) {
            hasLegacyDefault = true;
            registry.default = { key: 'default', ...legacy.data };
        } else if (!invalidLegacyIssuerWarned) {
            invalidLegacyIssuerWarned = true;
            console.warn('TRANSCRIPT_ISSUER_* is invalid and will be ignored');
        }
    }

    if (environment.TRANSCRIPT_ISSUERS) {
        try {
            const parsed = TranscriptIssuersValidator.parse(
                JSON.parse(environment.TRANSCRIPT_ISSUERS)
            );
            for (const issuer of Object.values(parsed)) {
                if (!isAllowedTranscriptIssuerEndpoint(issuer.endpoint)) {
                    throw new Error('Disallowed transcript issuer endpoint');
                }
            }
            if (
                hasLegacyDefault &&
                Object.hasOwn(parsed, 'default') &&
                !explicitDefaultOverridesLegacyWarned
            ) {
                explicitDefaultOverridesLegacyWarned = true;
                console.warn(
                    'TRANSCRIPT_ISSUERS defines "default" while legacy TRANSCRIPT_ISSUER_* variables are also set; the explicit entry takes precedence.'
                );
            }
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
    let tenants: ClassLinkConfig['tenants'] = {};
    try {
        if (tenantsJson) tenants = ClassLinkTenantsValidator.parse(JSON.parse(tenantsJson));
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
 * key, defaulting to `default` (the legacy TRANSCRIPT_ISSUER_* vars, or an explicit `default`
 * entry in TRANSCRIPT_ISSUERS). Returns null when no matching issuer is configured.
 */
export const getTranscriptIssuerConfig = (
    tenant?: { transcriptIssuer?: string } | null
): ResolvedTranscriptIssuer | null => {
    const key = tenant?.transcriptIssuer ?? 'default';
    return getTranscriptIssuerRegistry()[key] ?? null;
};
