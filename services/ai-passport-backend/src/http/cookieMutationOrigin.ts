/**
 * SameSite=None sessions require an Origin boundary before mutation handlers.
 * Bearer requests use an explicit credential rather than ambient cookies; the
 * server's existing bearer-first credential selection remains authoritative.
 */
export const isCookieMutationOriginAllowed = (
    request: Request,
    sessionCookieName: string,
    isAllowedOrigin: (origin: string) => boolean,
    serverOrigin: string
): boolean => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return true;

    const authorization = request.headers.get('authorization');
    if (authorization?.toLowerCase().startsWith('bearer ')) return true;

    const hasSessionCookie = request.headers
        .get('cookie')
        ?.split(';')
        .some(cookie => cookie.trim().split('=', 1)[0] === sessionCookieName);
    if (!hasSessionCookie) return true;

    const origin = request.headers.get('origin');
    // The fragment callback page is served by the API itself. Trust its configured
    // origin, never the incoming Host header, for reauthentication with a session.
    return Boolean(origin && (origin === serverOrigin || isAllowedOrigin(origin)));
};
