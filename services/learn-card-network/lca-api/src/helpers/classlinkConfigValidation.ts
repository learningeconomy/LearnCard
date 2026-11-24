import {
    ACCOUNT_CONTINUITY_CODE_DEFAULT,
    AccountContinuityOverrideValidator,
    type AccountContinuityPolicy,
} from '../types/accountContinuity';
import {
    ClassLinkTenantConfigValidator,
    ClassLinkTenantsValidator,
    TranscriptIssuersValidator,
    type ClassLinkConfig,
    type TranscriptIssuers,
} from '../types/classlink';
import { decodeClassLinkKey } from './classlinkKey';

const LOCAL_HTTP_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

/** HTTPS everywhere; loopback HTTP is permitted only outside production. */
const isAllowedTranscriptIssuerEndpoint = (url: string, nodeEnv?: string): boolean => {
    const parsed = new URL(url);
    return (
        parsed.protocol === 'https:' ||
        (parsed.protocol === 'http:' &&
            nodeEnv !== 'production' &&
            LOCAL_HTTP_HOSTNAMES.has(parsed.hostname.replace(/^\[|\]$/g, '')))
    );
};

/** Shared by runtime configuration and the offline configuration check. */
export const parseClassLinkTenants = (value?: string): ClassLinkConfig['tenants'] =>
    value?.trim() ? ClassLinkTenantsValidator.parse(JSON.parse(value)) : {};

/**
 * The code default with `CLASSLINK_ACCOUNT_CONTINUITY_DEFAULT` applied. Throws when the value
 * is not JSON matching `AccountContinuityOverrideValidator` (unknown keys included).
 */
export const parseAccountContinuityDefault = (value?: string): AccountContinuityPolicy => ({
    ...ACCOUNT_CONTINUITY_CODE_DEFAULT,
    ...(value?.trim() ? AccountContinuityOverrideValidator.parse(JSON.parse(value)) : {}),
});

/** Parse the only issuer source, applying the runtime transport policy. */
export const parseTranscriptIssuers = (value?: string, nodeEnv?: string): TranscriptIssuers => {
    const issuers = value?.trim() ? TranscriptIssuersValidator.parse(JSON.parse(value)) : {};
    for (const issuer of Object.values(issuers)) {
        if (!isAllowedTranscriptIssuerEndpoint(issuer.endpoint, nodeEnv)) {
            throw new Error('Disallowed transcript issuer endpoint');
        }
    }
    return issuers;
};

/** Names the entries whose `schoolEmailAliasMaxIdleDays` made the tenant map invalid. */
const collectAliasIdleProblems = (value: string): string[] => {
    let raw: unknown;
    try {
        raw = JSON.parse(value);
    } catch {
        return [];
    }
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return [];
    const field = ClassLinkTenantConfigValidator.shape.schoolEmailAliasMaxIdleDays;
    return Object.values(raw).flatMap((entry, index) =>
        typeof entry === 'object' &&
        entry !== null &&
        'schoolEmailAliasMaxIdleDays' in entry &&
        !field.safeParse((entry as Record<string, unknown>).schoolEmailAliasMaxIdleDays).success
            ? [
                  `CLASSLINK_TENANTS entry ${index + 1} has an invalid schoolEmailAliasMaxIdleDays (a whole number of days, 0-3650; 0 turns the school-email alias off).`,
              ]
            : []
    );
};

/**
 * Offline deployment diagnostics. Never includes configuration values (including map keys)
 * or raw parser errors. Does not load service configuration or contact external services.
 * An unset tenant override map opts out of this check, not of runtime ClassLink sign-in.
 */
export const collectClassLinkConfigProblems = (
    env: Readonly<Record<string, string | undefined>>
): string[] => {
    const problems: string[] = [];
    try {
        parseAccountContinuityDefault(env.CLASSLINK_ACCOUNT_CONTINUITY_DEFAULT);
    } catch {
        problems.push(
            'CLASSLINK_ACCOUNT_CONTINUITY_DEFAULT must be JSON matching the account-continuity schema.'
        );
    }
    if (!env.CLASSLINK_TENANTS?.trim()) return problems;
    let tenants: ClassLinkConfig['tenants'] | undefined;
    let issuers: TranscriptIssuers | undefined;
    try {
        tenants = parseClassLinkTenants(env.CLASSLINK_TENANTS);
    } catch {
        problems.push('CLASSLINK_TENANTS must be valid JSON matching the tenant schema.');
        problems.push(...collectAliasIdleProblems(env.CLASSLINK_TENANTS));
    }
    try {
        issuers = parseTranscriptIssuers(env.TRANSCRIPT_ISSUERS, env.NODE_ENV);
    } catch {
        problems.push(
            'TRANSCRIPT_ISSUERS must match the issuer schema (endpoint, audience, did, optional profileId); endpoints require HTTPS, except loopback HTTP outside production.'
        );
    }

    Object.values(tenants ?? {}).forEach((tenant, index) => {
        if (
            tenant.accountContinuity !== undefined &&
            !AccountContinuityOverrideValidator.safeParse(tenant.accountContinuity).success
        )
            problems.push(
                `CLASSLINK_TENANTS entry ${index + 1} has an invalid accountContinuity value (personal email is off for that district).`
            );
    });

    if (tenants && issuers) {
        Object.values(tenants).forEach((tenant, index) => {
            if (!tenant.transcriptEnabled && !tenant.transcriptIssuer) return;
            const key = tenant.transcriptIssuer ?? 'default';
            const issuer = Object.hasOwn(issuers, key) ? issuers[key] : undefined;
            if (!issuer) {
                problems.push(
                    `CLASSLINK_TENANTS entry ${index + 1} references an unknown transcript issuer key (including the implicit default).`
                );
            } else if (tenant.transcriptEnabled && (!issuer.did || !issuer.profileId)) {
                problems.push(
                    `CLASSLINK_TENANTS entry ${index + 1} enables transcripts but its issuer needs both did and profileId.`
                );
            }
        });
    }

    for (const key of [
        'CLASSLINK_CLIENT_ID',
        'CLASSLINK_CLIENT_SECRET',
        'CLASSLINK_REDIRECT_URIS',
    ]) {
        if (
            !env[key]?.trim() ||
            (key === 'CLASSLINK_REDIRECT_URIS' && !env[key]?.split(',').some(uri => uri.trim()))
        ) {
            problems.push(`${key} is required when CLASSLINK_TENANTS is configured.`);
        }
    }
    for (const key of [
        'CLASSLINK_PII_KEY',
        'CLASSLINK_IDENTITY_KEY',
        'CLASSLINK_PII_KEY_PREVIOUS',
    ]) {
        const value = env[key]?.trim();
        if (!value && key !== 'CLASSLINK_PII_KEY') continue;
        const decoded = decodeClassLinkKey(value);
        if (!decoded) problems.push(`${key} must be canonical base64 encoding exactly 32 bytes.`);
        decoded?.fill(0);
    }
    if (!env.CLASSLINK_IDENTITY_KEY?.trim() && env.CLASSLINK_PII_KEY_PREVIOUS?.trim()) {
        problems.push(
            'CLASSLINK_IDENTITY_KEY is required during PII key rotation; the PII key fallback is unsafe.'
        );
    }
    return problems;
};

/**
 * Account-continuity settings that are valid but risky. Like the problems above, messages
 * never include configuration values or tenant IDs.
 */
export const collectAccountContinuityWarnings = (
    env: Readonly<Record<string, string | undefined>>
): string[] => {
    const warnings: string[] = [];
    let defaultPolicy: AccountContinuityPolicy;
    let tenants: ClassLinkConfig['tenants'];
    try {
        defaultPolicy = parseAccountContinuityDefault(env.CLASSLINK_ACCOUNT_CONTINUITY_DEFAULT);
        tenants = parseClassLinkTenants(env.CLASSLINK_TENANTS);
    } catch {
        return warnings; // Reported as problems.
    }
    const check = (label: string, policy: AccountContinuityPolicy): void => {
        if (policy.personalEmail !== 'all') return;
        if (policy.minimumAge === undefined)
            warnings.push(`${label} lets students add a personal email with no minimumAge.`);
        if (policy.approval === 'guardian')
            warnings.push(
                `${label} requires guardian approval, which does not exist yet, so every student is refused.`
            );
    };
    check('CLASSLINK_ACCOUNT_CONTINUITY_DEFAULT', defaultPolicy);
    Object.values(tenants).forEach((tenant, index) => {
        const parsed = AccountContinuityOverrideValidator.safeParse(tenant.accountContinuity);
        if (tenant.accountContinuity !== undefined && parsed.success)
            check(`CLASSLINK_TENANTS entry ${index + 1}`, { ...defaultPolicy, ...parsed.data });
    });
    return warnings;
};
