type RedirectHistory = {
    push: (path: string) => unknown;
    replace: (path: string) => unknown;
};

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

/** Recover the original URL component before history@4's partial decodeURI decoding. */
export const getInAppMessageEntryPath = (pathname: string): string => {
    if (typeof window === 'undefined') return pathname;
    const rawPath = window.location.pathname;
    if (!isSafeInAppMessageAuthRedirect(rawPath)) return pathname;
    return rawPath === pathname || decodeURI(rawPath) === pathname ? rawPath : pathname;
};

export const resumeAuthRedirect = (history: RedirectHistory, path: string): void => {
    if (isSafeInAppMessageAuthRedirect(path)) {
        // history@4 decodes pathname once before writing it back to the address bar.
        history.replace(encodeURI(path));
        return;
    }

    history.push(path);
};
