/** Only same-app paths: `/x` yes; `//host`, `/\\host`, `https://…`, `javascript:` no. */
export const sanitizeNextPath = (raw: string | null, fallback = '/wallet'): string => {
    if (!raw) return fallback;
    if (!/^\/(?![/\\])/.test(raw)) return fallback;
    try {
        const url = new URL(raw, 'https://placeholder.invalid');
        if (url.origin !== 'https://placeholder.invalid') return fallback;
        return url.pathname + url.search + url.hash;
    } catch {
        return fallback;
    }
};
