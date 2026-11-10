import {
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

/**
 * Offline deployment diagnostics. Never includes configuration values (including map keys)
 * or raw parser errors. Does not load service configuration or contact external services.
 * An unset tenant override map opts out of this check, not of runtime ClassLink sign-in.
 */
export const collectClassLinkConfigProblems = (
    env: Readonly<Record<string, string | undefined>>
): string[] => {
    if (!env.CLASSLINK_TENANTS?.trim()) return [];
    const problems: string[] = [];
    let tenants: ClassLinkConfig['tenants'] | undefined;
    let issuers: TranscriptIssuers | undefined;
    try {
        tenants = parseClassLinkTenants(env.CLASSLINK_TENANTS);
    } catch {
        problems.push('CLASSLINK_TENANTS must be valid JSON matching the tenant schema.');
    }
    try {
        issuers = parseTranscriptIssuers(env.TRANSCRIPT_ISSUERS, env.NODE_ENV);
    } catch {
        problems.push(
            'TRANSCRIPT_ISSUERS must match the issuer schema (endpoint, audience, did, optional profileId); endpoints require HTTPS, except loopback HTTP outside production.'
        );
    }

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
