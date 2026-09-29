import {
    SHARE_CONTENT_KEY_BYTES,
    SHARE_LINK_ID_BYTES,
    ShareContentKeyValidator,
    ShareLinkIdValidator,
} from '@learncard/types';

/**
 * Canonical LC-2187 link grammar: `https://{host}/s/{id}#{key}`.
 *
 * The 256-bit content key lives only in the fragment. `parseShareLinkUrl` is
 * intentionally narrow: it never treats a legacy share route
 * (`/share-creds/:uri/:seed` or `?uri=&seed=&pin=`) as a new-format link, and it
 * never normalizes or truncates the id/key. Long tenant hosts keep full key
 * entropy; the total length is host-dependent.
 */

export const SHARE_LINK_PATH_PREFIX = '/s/';

/** `https://` + `/s/` + 22-char id + `#` + 43-char key. */
export const SHARE_LINK_FIXED_OVERHEAD_CHARS =
    'https://'.length + SHARE_LINK_PATH_PREFIX.length + 22 + '#'.length + 43;

/** Conservative DNS-ish host bound; ports are allowed but no scheme/path/userinfo. */
export const MAX_SHARE_LINK_HOST_CHARS = 300;
/** Bound the whole parse input so a hostile string cannot allocate unbounded work. */
export const MAX_SHARE_LINK_URL_CHARS =
    MAX_SHARE_LINK_HOST_CHARS + SHARE_LINK_FIXED_OVERHEAD_CHARS + 16;

const HOST_RE = /^[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?(?::[0-9]{1,5})?$/;

/** Exact character length of a canonical link for a given host. */
export const shareLinkLength = (host: string): number =>
    SHARE_LINK_FIXED_OVERHEAD_CHARS + host.length;

const assertShareId = (id: unknown): string => {
    const result = ShareLinkIdValidator.safeParse(id);
    if (!result.success) throw new Error('id must be a 22-character canonical base64url share id');
    return result.data;
};

const assertContentKey = (key: unknown): string => {
    const result = ShareContentKeyValidator.safeParse(key);
    if (!result.success)
        throw new Error('key must be a 43-character canonical base64url content key');
    return result.data;
};

const assertHost = (host: unknown): string => {
    if (typeof host !== 'string' || host.length === 0 || host.length > MAX_SHARE_LINK_HOST_CHARS) {
        throw new Error(`host must be 1..${MAX_SHARE_LINK_HOST_CHARS} characters`);
    }
    if (!HOST_RE.test(host)) {
        throw new Error('host must be a bare host[:port] with no scheme, path or userinfo');
    }
    try {
        new URL(`https://${host}`);
    } catch {
        throw new Error('host is not a valid HTTPS authority');
    }
    return host;
};

/**
 * Build the canonical link. Throws a plain `Error` on a non-canonical id/key or
 * an invalid host rather than emitting a link that would not parse.
 */
export const buildShareLinkUrl = (host: string, id: string, key: string): string => {
    const safeHost = assertHost(host);
    const safeId = assertShareId(id);
    const safeKey = assertContentKey(key);

    return `https://${safeHost}${SHARE_LINK_PATH_PREFIX}${safeId}#${safeKey}`;
};

export type ShareLinkUrlFailureReason =
    | 'NOT_A_STRING'
    | 'TOO_LONG'
    | 'MALFORMED_URL'
    | 'UNSUPPORTED_PROTOCOL'
    | 'UNEXPECTED_QUERY'
    | 'NOT_SHARE_LINK'
    | 'INVALID_ID'
    | 'INVALID_KEY';

export type ParseShareLinkUrlResult =
    | { ok: true; id: string; key: string; host: string; url: string }
    | { ok: false; reason: ShareLinkUrlFailureReason };

const failure = (reason: ShareLinkUrlFailureReason): ParseShareLinkUrlResult => ({
    ok: false,
    reason,
});

/**
 * Parse a canonical link without normalizing its id/key. Legacy routes and any
 * URL that merely contains a base64url-looking segment fail closed.
 */
export const parseShareLinkUrl = (raw: unknown): ParseShareLinkUrlResult => {
    if (typeof raw !== 'string') return failure('NOT_A_STRING');
    if (raw.length > MAX_SHARE_LINK_URL_CHARS) return failure('TOO_LONG');

    let url: URL;
    try {
        url = new URL(raw);
    } catch {
        return failure('MALFORMED_URL');
    }

    if (url.username || url.password || raw.trim() !== raw || /[\\\r\n\t]/.test(raw))
        return failure('MALFORMED_URL');
    if (url.protocol !== 'https:') return failure('UNSUPPORTED_PROTOCOL');
    if (url.search.length > 0) return failure('UNEXPECTED_QUERY');
    if (!url.pathname.startsWith(SHARE_LINK_PATH_PREFIX)) return failure('NOT_SHARE_LINK');

    const id = url.pathname.slice(SHARE_LINK_PATH_PREFIX.length);
    if (id.length === 0 || id.includes('/')) return failure('NOT_SHARE_LINK');

    const key = url.hash.startsWith('#') ? url.hash.slice(1) : '';

    if (!ShareLinkIdValidator.safeParse(id).success) return failure('INVALID_ID');
    if (!ShareContentKeyValidator.safeParse(key).success) return failure('INVALID_KEY');

    return { ok: true, id, key, host: url.host, url: raw };
};

/** Re-exported byte lengths so callers can document the host-dependent total. */
export { SHARE_LINK_ID_BYTES, SHARE_CONTENT_KEY_BYTES };
