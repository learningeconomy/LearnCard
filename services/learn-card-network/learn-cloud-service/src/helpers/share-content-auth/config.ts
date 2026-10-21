import type { ShareContentTrustConfig } from './types';

/**
 * Build the trust configuration from an explicit, caller-supplied object.
 *
 * Nothing here reads `process.env`, secrets or a bootstrap file: the batch that
 * owns environment wiring must construct this deliberately and pass it in. Any
 * missing or invalid value when `enabled` is true collapses to the disabled
 * configuration so access fails closed rather than partially.
 */

export const HARD_MAX_TOKEN_TTL_SECONDS = 60;
export const HARD_MAX_CLOCK_SKEW_SECONDS = 60;
export const HARD_MIN_TOKEN_BYTES = 256;
export const HARD_MAX_TOKEN_BYTES = 65_536;
export const DEFAULT_MAX_TOKEN_BYTES = 8_192;
export const DEFAULT_MIN_JTI_LENGTH = 16;
export const DEFAULT_MAX_JTI_LENGTH = 128;

export const DISABLED_SHARE_CONTENT_TRUST_CONFIG: ShareContentTrustConfig = Object.freeze({
    enabled: false,
    audience: '',
    allowedServiceDids: Object.freeze([]) as readonly string[],
    allowedVerificationMethods: Object.freeze([]) as readonly string[],
    allowedAlgorithms: Object.freeze(['EdDSA']) as readonly string[],
    clockSkewSeconds: 5,
    maxTokenTtlSeconds: HARD_MAX_TOKEN_TTL_SECONDS,
    maxTokenBytes: DEFAULT_MAX_TOKEN_BYTES,
    minJtiLength: DEFAULT_MIN_JTI_LENGTH,
    maxJtiLength: DEFAULT_MAX_JTI_LENGTH,
});

const toStringList = (value: unknown): string[] | null => {
    if (typeof value === 'string') {
        const parts = value
            .split(',')
            .map(part => part.trim())
            .filter(part => part.length > 0);

        return parts;
    }

    if (Array.isArray(value)) {
        if (!value.every(item => typeof item === 'string')) return null;

        const parts = (value as string[]).map(part => part.trim()).filter(part => part.length > 0);

        return parts;
    }

    return null;
};

const readBoolean = (value: unknown): boolean => value === true;

const readBoundedInteger = (
    value: unknown,
    fallback: number,
    minimum: number,
    maximum: number
): number | null => {
    if (value === undefined) return fallback;
    if (typeof value !== 'number' || !Number.isSafeInteger(value)) return null;
    if (value < minimum || value > maximum) return null;

    return value;
};

/**
 * Resolve explicit configuration. Returns the frozen, fully-validated config or
 * the disabled config. An empty allowlist, empty audience or `enabled: false`
 * disables all access.
 */
export const resolveShareContentTrustConfig = (raw: unknown): ShareContentTrustConfig => {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        return DISABLED_SHARE_CONTENT_TRUST_CONFIG;
    }

    const source = raw as Record<string, unknown>;

    if (!readBoolean(source.enabled)) return DISABLED_SHARE_CONTENT_TRUST_CONFIG;

    const audience = source.audience;
    if (typeof audience !== 'string' || audience.trim().length === 0) {
        return DISABLED_SHARE_CONTENT_TRUST_CONFIG;
    }

    const serviceDids = toStringList(source.serviceDids);
    const verificationMethods = toStringList(source.verificationMethods);

    if (!serviceDids || serviceDids.length === 0) return DISABLED_SHARE_CONTENT_TRUST_CONFIG;
    if (!verificationMethods || verificationMethods.length === 0) {
        return DISABLED_SHARE_CONTENT_TRUST_CONFIG;
    }

    const allowedAlgorithms = toStringList(source.allowedAlgorithms) ?? ['EdDSA'];
    if (allowedAlgorithms.length === 0) return DISABLED_SHARE_CONTENT_TRUST_CONFIG;

    const clockSkewSeconds = readBoundedInteger(
        source.clockSkewSeconds,
        DISABLED_SHARE_CONTENT_TRUST_CONFIG.clockSkewSeconds,
        0,
        HARD_MAX_CLOCK_SKEW_SECONDS
    );
    const maxTokenTtlSeconds = readBoundedInteger(
        source.maxTokenTtlSeconds,
        HARD_MAX_TOKEN_TTL_SECONDS,
        1,
        HARD_MAX_TOKEN_TTL_SECONDS
    );
    const maxTokenBytes = readBoundedInteger(
        source.maxTokenBytes,
        DEFAULT_MAX_TOKEN_BYTES,
        HARD_MIN_TOKEN_BYTES,
        HARD_MAX_TOKEN_BYTES
    );
    const minJtiLength = readBoundedInteger(
        source.minJtiLength,
        DEFAULT_MIN_JTI_LENGTH,
        8,
        DEFAULT_MAX_JTI_LENGTH
    );
    const maxJtiLength = readBoundedInteger(
        source.maxJtiLength,
        DEFAULT_MAX_JTI_LENGTH,
        DEFAULT_MIN_JTI_LENGTH,
        512
    );

    if (
        clockSkewSeconds === null ||
        maxTokenTtlSeconds === null ||
        maxTokenBytes === null ||
        minJtiLength === null ||
        maxJtiLength === null ||
        minJtiLength > maxJtiLength
    ) {
        return DISABLED_SHARE_CONTENT_TRUST_CONFIG;
    }

    return Object.freeze({
        enabled: true,
        audience,
        allowedServiceDids: Object.freeze([...serviceDids]),
        allowedVerificationMethods: Object.freeze([...verificationMethods]),
        allowedAlgorithms: Object.freeze([...allowedAlgorithms]),
        clockSkewSeconds,
        maxTokenTtlSeconds,
        maxTokenBytes,
        minJtiLength,
        maxJtiLength,
    });
};

/** A config only authorizes traffic when it is enabled and its allowlists are non-empty. */
export const isShareContentTrustConfigActive = (config: ShareContentTrustConfig): boolean =>
    config.enabled &&
    config.audience.length > 0 &&
    config.allowedServiceDids.length > 0 &&
    config.allowedVerificationMethods.length > 0;
