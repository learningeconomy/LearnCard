import { isSafeInAppMessagePath } from '@learncard/types';
import { toSafeFrameUrl } from './frameUrl';

/** Append an app-relative page while preserving the configured app origin and base path. */
export const buildEmbedUrlWithPath = (
    embedUrl: string,
    path: string | undefined,
    hostOrigin: string
): string | null => {
    const safeBase = toSafeFrameUrl(embedUrl);
    if (!safeBase || (path !== undefined && !isSafeInAppMessagePath(path))) return null;
    try {
        const base = new URL(safeBase);
        const origin = base.origin;
        if (path !== undefined) {
            const page = new URL(path, origin);
            if (page.origin !== origin) return null;
            base.pathname = base.pathname.replace(/\/$/, '') + page.pathname;
            page.searchParams.forEach((value, key) => base.searchParams.set(key, value));
            base.hash = page.hash;
        }
        base.searchParams.set('lc_host_override', hostOrigin);
        return base.origin === origin ? toSafeFrameUrl(base.toString()) : null;
    } catch {
        return null;
    }
};
