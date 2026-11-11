const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Returns an address that is safe to load in an app frame, or null.
 *
 * Only `https:` addresses are allowed, plus `http:` on localhost for testing. The
 * result is rebuilt with a fixed scheme rather than echoing the input, so schemes
 * such as `javascript:` or `data:` can never reach an iframe `src`.
 */
export const toSafeFrameUrl = (raw: string | undefined | null): string | null => {
    if (!raw) return null;

    let url: URL;
    try {
        url = new URL(raw);
    } catch {
        return null;
    }

    if (url.username || url.password) return null;

    if (url.protocol === 'https:') {
        return `https://${url.host}${url.pathname}${url.search}${url.hash}`;
    }

    if (url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname)) {
        return `http://${url.host}${url.pathname}${url.search}${url.hash}`;
    }

    return null;
};
