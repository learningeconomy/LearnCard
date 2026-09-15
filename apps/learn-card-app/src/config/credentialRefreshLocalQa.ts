/** Local QA is opt-in, dev-server-only, and limited to loopback app/backend origins. */
export const getCredentialRefreshLocalQaOrigin = (
    dev: boolean,
    enabled: boolean,
    appOrigin: string,
    brainUrl: string
): string | undefined => {
    if (!dev || !enabled) return undefined;
    try {
        const app = new URL(appOrigin);
        const brain = new URL(brainUrl);
        const loopback = ['localhost', '127.0.0.1', '[::1]'];
        if (
            !loopback.includes(app.hostname) ||
            !loopback.includes(brain.hostname) ||
            !['http:', 'https:'].includes(app.protocol) ||
            !['http:', 'https:'].includes(brain.protocol) ||
            brain.username ||
            brain.password
        )
            return undefined;
        return brain.origin;
    } catch {
        return undefined;
    }
};
