/** Self-origin trust comes only from configured DOMAIN, never request/proxy headers. */
export function canonicalOrigin(domain: string): string {
    const value = new URL(domain);
    if (!['https:', 'http:'].includes(value.protocol) || value.username || value.password)
        throw new Error('Invalid canonical domain');
    return value.origin;
}
export function trustedOrigins(domain: string, cors: string[]): string[] {
    return [...new Set([canonicalOrigin(domain), ...cors])];
}
export function trustedAdminReadOrigin(
    req: Request,
    domain: string,
    cors: string[]
): string | null {
    const own = canonicalOrigin(domain);
    const origin = req.headers.get('Origin');
    if (origin) return trustedOrigins(domain, cors).includes(origin) ? origin : null;
    if (req.method !== 'GET' || req.headers.get('Sec-Fetch-Site') === 'cross-site') return null;
    // Credentialed same-origin GET normally omits Origin. Browser SOP prevents external reads.
    return own;
}
