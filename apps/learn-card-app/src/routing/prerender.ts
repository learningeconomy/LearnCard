/**
 * Paths `react-router build` renders to static HTML (react-router.config.ts). Each file holds only
 * the document shell and the startup fallback: the app boots on the client like every other path.
 */
export const PRERENDER_PATHS = ['/login', '/legal/terms', '/legal/privacy'] as const;

/**
 * Paths that must never become static or cached HTML. Share links (/s/:id), shared boosts and
 * shared resumes are per-recipient views; prerendering or caching them would serve one person's
 * view to everyone. finalizeStaticBuild fails the build if HTML for any of them is emitted.
 */
const NEVER_PRERENDER = [/^\/s(?:\/|$)/, /^\/share-boost(?:\/|$)/, /^\/verify\/resume(?:\/|$)/];

export const isNeverPrerendered = (pathname: string): boolean =>
    NEVER_PRERENDER.some(pattern => pattern.test(pathname));

export const safePrerenderPaths = (paths: readonly string[]): string[] => {
    const unsafe = paths.filter(isNeverPrerendered);
    if (unsafe.length > 0)
        throw new Error(`Refusing to prerender private paths: ${unsafe.join(', ')}`);
    return [...paths];
};
