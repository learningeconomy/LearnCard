import { createHmac, timingSafeEqual } from 'node:crypto';
export const ADMIN_FRESHNESS_MS = 5 * 60 * 1000;
export function isServicePrincipal(
    session: { did: string; authenticatedAt?: number } | null,
    configuredDid: string,
    actualDid: string
): boolean {
    return Boolean(
        session &&
        configuredDid.startsWith('did:') &&
        configuredDid === actualDid &&
        session.did === actualDid
    );
}
export function isFreshAdmin(session: { authenticatedAt?: number }, now = Date.now()) {
    return (
        typeof session.authenticatedAt === 'number' &&
        session.authenticatedAt <= now &&
        now - session.authenticatedAt <= ADMIN_FRESHNESS_MS
    );
}
// The opaque random session token acts as an HMAC secret. No new configured key.
export const csrfToken = (sessionId: string, origin: string) =>
    createHmac('sha256', sessionId).update(`passport-admin-v1|${origin}`).digest('base64url');
export function validAdminMutation(req: Request, sessionId: string, origins: string[]) {
    const origin = req.headers.get('Origin');
    if (
        !origin ||
        !origins.includes(origin) ||
        new URL(origin).origin !== origin ||
        req.headers.get('Content-Type')?.split(';')[0] !== 'application/json'
    )
        return false;
    const token = req.headers.get('X-Passport-CSRF') ?? '';
    const expected = csrfToken(sessionId, origin);
    return (
        /^[A-Za-z0-9_-]{43}$/.test(token) &&
        token.length === expected.length &&
        timingSafeEqual(Buffer.from(token), Buffer.from(expected))
    );
}
