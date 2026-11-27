import type { NavigateFunction } from 'react-router';

export const isSafeInAppMessageAuthRedirect = (path: string): boolean => {
    // The final segment is an opaque message ID, not an embedded-app navigation path.
    const match = /^\/m\/([^/?#\\\s]+)\/?$/i.exec(path);
    if (
        !match?.[1] ||
        [...path].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
    )
        return false;
    try {
        const id = decodeURIComponent(match[1]);
        return id !== '.' && id !== '..';
    } catch {
        return false;
    }
};

/**
 * Recover the address bar's encoded pathname when `pathname` arrived decoded (React Router 5's
 * history@4 decoded it once; React Router 8 keeps it encoded, so this returns it unchanged).
 */
export const getInAppMessageEntryPath = (pathname: string): string => {
    if (typeof window === 'undefined') return pathname;
    const rawPath = window.location.pathname;
    if (!isSafeInAppMessageAuthRedirect(rawPath)) return pathname;
    return rawPath === pathname || decodeURI(rawPath) === pathname ? rawPath : pathname;
};

export const resumeAuthRedirect = (navigate: NavigateFunction, path: string): void => {
    if (isSafeInAppMessageAuthRedirect(path)) {
        // The message ID stays percent-encoded: React Router 8 writes the path as given.
        void navigate(path, { replace: true });
        return;
    }

    void navigate(path);
};
