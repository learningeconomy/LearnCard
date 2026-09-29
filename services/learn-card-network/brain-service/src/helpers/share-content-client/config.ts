import {
    DEFAULT_MAX_SHARE_CONTENT_REQUEST_BYTES,
    DEFAULT_MAX_SHARE_CONTENT_RESPONSE_BYTES,
    DEFAULT_SHARE_CONTENT_MAX_ATTEMPTS,
    DEFAULT_SHARE_CONTENT_REQUEST_TIMEOUT_MS,
    DEFAULT_SHARE_CONTENT_RETRY_BACKOFF_MS,
    MAX_SHARE_CONTENT_RETRY_BACKOFF_MS,
    ShareContentClientConfigurationError,
    type ShareContentClientConfig,
    type ShareContentTokenSigner,
} from './types';

/**
 * Explicit, fail-closed client configuration. Nothing here reads environment
 * variables or secrets: the wiring batch constructs it deliberately.
 *
 * A missing/invalid origin, namespace, audience, signer DID or signer function
 * collapses to the disabled configuration, so a partially configured deployment
 * never performs a signed request. There is deliberately no offline or unsigned
 * bypass.
 */

const OPAQUE_IDENTIFIER_RE = /^[A-Za-z0-9._~-]+$/;
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

const disabledSigner: ShareContentTokenSigner = async () => {
    throw new ShareContentClientConfigurationError('share-content client is disabled');
};

export const DISABLED_SHARE_CONTENT_CLIENT_CONFIG: ShareContentClientConfig = Object.freeze({
    enabled: false,
    origin: '',
    namespace: '',
    audience: '',
    signerDid: '',
    allowInsecureLoopback: false,
    signer: disabledSigner,
    requestTimeoutMs: DEFAULT_SHARE_CONTENT_REQUEST_TIMEOUT_MS,
    maxAttempts: 1,
    retryBackoffMs: 0,
    maxRequestBytes: DEFAULT_MAX_SHARE_CONTENT_REQUEST_BYTES,
    maxResponseBytes: DEFAULT_MAX_SHARE_CONTENT_RESPONSE_BYTES,
    now: () => Date.now(),
    sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
    fetchImpl: ((...args: Parameters<typeof fetch>) => fetch(...args)) as typeof fetch,
}) as ShareContentClientConfig;

const isOpaqueIdentifier = (value: unknown, maxLength = 128): value is string =>
    typeof value === 'string' &&
    value.length >= 1 &&
    value.length <= maxLength &&
    OPAQUE_IDENTIFIER_RE.test(value);

const isBoundedInteger = (value: unknown, minimum: number, maximum: number): value is number =>
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= minimum &&
    value <= maximum;

/**
 * Validate a configured origin. Only an `https:` origin is trusted; a loopback
 * `http:` origin is accepted only when `allowInsecureLoopback` is explicitly set
 * for local tests/development, and the cryptographic auth path is unchanged.
 */
export const validateShareContentOrigin = (
    origin: unknown,
    allowInsecureLoopback: boolean
): { ok: true; origin: string } | { ok: false; reason: string } => {
    if (typeof origin !== 'string' || origin.trim().length === 0) {
        return { ok: false, reason: 'origin must be a non-empty string' };
    }

    let url: URL;

    try {
        url = new URL(origin);
    } catch {
        return { ok: false, reason: 'origin must be a valid absolute URL' };
    }

    if (url.username || url.password) {
        return { ok: false, reason: 'origin must not contain userinfo' };
    }
    if (url.search || url.hash) {
        return { ok: false, reason: 'origin must not contain a query or fragment' };
    }
    if (url.pathname !== '/' && url.pathname !== '') {
        return { ok: false, reason: 'origin must not contain a path' };
    }

    if (url.protocol === 'https:') {
        return { ok: true, origin: `${url.protocol}//${url.host}` };
    }

    if (url.protocol === 'http:') {
        if (!allowInsecureLoopback) {
            return { ok: false, reason: 'insecure http origin requires allowInsecureLoopback' };
        }
        if (!LOOPBACK_HOSTS.has(url.hostname)) {
            return { ok: false, reason: 'insecure http origin must be loopback' };
        }

        return { ok: true, origin: `${url.protocol}//${url.host}` };
    }

    return { ok: false, reason: 'origin must use https (or loopback http for local tests)' };
};

/** Build a validated, frozen client configuration, or the disabled config. */
export const resolveShareContentClientConfig = (raw: unknown): ShareContentClientConfig => {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        return DISABLED_SHARE_CONTENT_CLIENT_CONFIG;
    }

    const source = raw as Record<string, unknown>;

    if (source.enabled !== true) return DISABLED_SHARE_CONTENT_CLIENT_CONFIG;

    const allowInsecureLoopback = source.allowInsecureLoopback === true;
    const originResult = validateShareContentOrigin(source.origin, allowInsecureLoopback);

    if (!originResult.ok) return DISABLED_SHARE_CONTENT_CLIENT_CONFIG;

    if (!isOpaqueIdentifier(source.namespace)) return DISABLED_SHARE_CONTENT_CLIENT_CONFIG;
    if (typeof source.audience !== 'string' || source.audience.trim().length === 0) {
        return DISABLED_SHARE_CONTENT_CLIENT_CONFIG;
    }
    if (typeof source.signerDid !== 'string' || !source.signerDid.startsWith('did:')) {
        return DISABLED_SHARE_CONTENT_CLIENT_CONFIG;
    }
    if (typeof source.signer !== 'function') return DISABLED_SHARE_CONTENT_CLIENT_CONFIG;

    const signer = source.signer as ShareContentTokenSigner;
    const requestTimeoutMs = isBoundedInteger(source.requestTimeoutMs, 1, 120_000)
        ? source.requestTimeoutMs
        : DEFAULT_SHARE_CONTENT_REQUEST_TIMEOUT_MS;
    const maxAttempts = isBoundedInteger(source.maxAttempts, 1, 10)
        ? source.maxAttempts
        : DEFAULT_SHARE_CONTENT_MAX_ATTEMPTS;
    const retryBackoffMs = isBoundedInteger(
        source.retryBackoffMs,
        0,
        MAX_SHARE_CONTENT_RETRY_BACKOFF_MS
    )
        ? source.retryBackoffMs
        : DEFAULT_SHARE_CONTENT_RETRY_BACKOFF_MS;
    const maxRequestBytes = isBoundedInteger(
        source.maxRequestBytes,
        1024,
        DEFAULT_MAX_SHARE_CONTENT_REQUEST_BYTES
    )
        ? source.maxRequestBytes
        : DEFAULT_MAX_SHARE_CONTENT_REQUEST_BYTES;
    const maxResponseBytes = isBoundedInteger(
        source.maxResponseBytes,
        1024,
        DEFAULT_MAX_SHARE_CONTENT_RESPONSE_BYTES
    )
        ? source.maxResponseBytes
        : DEFAULT_MAX_SHARE_CONTENT_RESPONSE_BYTES;

    const now = typeof source.now === 'function' ? (source.now as () => number) : () => Date.now();
    const sleep =
        typeof source.sleep === 'function'
            ? (source.sleep as (ms: number) => Promise<void>)
            : (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const fetchImpl =
        typeof source.fetchImpl === 'function'
            ? (source.fetchImpl as typeof fetch)
            : (((...args: Parameters<typeof fetch>) => fetch(...args)) as typeof fetch);

    return Object.freeze({
        enabled: true,
        origin: originResult.origin,
        namespace: source.namespace,
        audience: source.audience,
        signerDid: source.signerDid,
        allowInsecureLoopback,
        signer,
        requestTimeoutMs,
        maxAttempts,
        retryBackoffMs,
        maxRequestBytes,
        maxResponseBytes,
        now,
        sleep,
        fetchImpl,
    }) as ShareContentClientConfig;
};
