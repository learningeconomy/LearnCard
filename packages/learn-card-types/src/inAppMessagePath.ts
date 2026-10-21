/** A path within an embedded app, never an origin, scheme, or traversal. */
export const isSafeInAppMessagePath = (path: string): boolean => {
    let decoded = path;
    for (let depth = 0; depth < 5; depth += 1) {
        if (
            !decoded.startsWith('/') ||
            decoded.startsWith('//') ||
            /[\\\s]/.test(decoded) ||
            [...decoded].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) ||
            decoded
                .split(/[?#]/, 1)[0]
                .split('/')
                .some(part => part === '.' || part === '..')
        )
            return false;
        try {
            const next = decodeURIComponent(decoded);
            if (next === decoded) return true;
            decoded = next;
        } catch {
            return false;
        }
    }
    return false;
};
