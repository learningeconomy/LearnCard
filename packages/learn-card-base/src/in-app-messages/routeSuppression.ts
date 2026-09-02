export const DEFAULT_SUPPRESSED_ROUTE_PREFIXES: string[] = [
    '/login',
    '/__/auth',
    '/acctmgmt/__/auth',
    '/waitingsofa',
    '/auth/handoff',
    '/claim',
    '/consent-flow',
    '/verify-email',
    '/legal',
    '/hidden',
    '/connect',
    '/invite',
    '/share',
    '/interactions',
    '/request',
    '/oid4vci',
    '/oid4vp',
    '/approve-account',
];

export const isRouteSuppressed = (pathname: string, prefixes: string[]): boolean =>
    prefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
