export const isValidUrl = (str: string): boolean => {
    try {
        const url = new URL(str);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

/**
 * Sets query params on a URL, merging with any existing query string. Unlike
 * `${url}?key=value` concatenation, this stays well-formed when `url` already
 * has a query string (which would otherwise produce a malformed double-`?` URL
 * that silently drops the appended param). Throws on invalid absolute URLs.
 */
export const appendQueryParams = (rawUrl: string, params: Record<string, string>): string => {
    const url = new URL(rawUrl);

    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
    }

    return url.toString();
};

export const getMediaBaseUrl = (url: string | null | undefined): string => {
    if (!url) return '';

    return url.replace(/(https?:\/\/(www\.)?)/, '').split('/')[0];
};

export const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
        // [::1] is the IPv6 localhost address.
        window.location.hostname === '[::1]' ||
        // 127.0.0.0/8 are considered localhost for IPv4.
        window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);
