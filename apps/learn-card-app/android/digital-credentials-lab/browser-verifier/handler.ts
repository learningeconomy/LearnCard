import { createDcApiRequest, verifyDcApiResponse } from '@openeudi/openid4vp';
import { ISSUER_JWK, QUERY } from './contract';

const TTL_MS = 5 * 60_000;
const COOKIE = '__Host-lc-independent-verifier';
const json = (body: unknown, status = 200): Response =>
    Response.json(body, {
        status,
        headers: { 'Cache-Control': 'no-store' },
    });

/** Synthetic-only development endpoint. Each browser gets a single-use, expiring nonce. */
export const createVerifierHandler = (origin: string, now: () => number = Date.now) => {
    if (new URL(origin).origin !== origin || !origin.startsWith('https://'))
        throw new Error('Configure a canonical HTTPS verifier origin');
    const sessions = new Map<string, { nonce: string; expiresAt: number }>();
    return async (request: Request): Promise<Response> => {
        for (const [id, session] of sessions) if (session.expiresAt <= now()) sessions.delete(id);
        if (request.headers.get('Origin') !== origin)
            return json({ error: 'Origin not allowed' }, 403);
        if (request.method !== 'POST') return json({ error: 'Use POST' }, 405);
        const path = new URL(request.url).pathname;
        const id = request.headers
            .get('Cookie')
            ?.split(';')
            .map(part => part.trim())
            .find(part => part.startsWith(`${COOKIE}=`))
            ?.slice(COOKIE.length + 1);
        if (path === '/api/request') {
            if (id) sessions.delete(id);
            if (sessions.size >= 32)
                return json({ error: 'Too many active requests. Try again shortly.' }, 429);
            const sessionId = crypto.randomUUID();
            const nonce = crypto.randomUUID();
            const built = await createDcApiRequest(
                {
                    protocol: 'openid4vp-v1-unsigned',
                    responseMode: 'dc_api',
                    nonce,
                    vpFormatsSupported: {
                        'dc+sd-jwt': { sd_jwt_alg_values: ['EdDSA'], kb_jwt_alg_values: ['EdDSA'] },
                    },
                },
                structuredClone(QUERY)
            );
            sessions.set(sessionId, { nonce, expiresAt: now() + TTL_MS });
            const response = json({ request: built.request, expiresAt: now() + TTL_MS });
            response.headers.set(
                'Set-Cookie',
                `${COOKIE}=${sessionId}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=300`
            );
            return response;
        }
        const session = id && sessions.get(id);
        if (!session) return json({ error: 'Request expired. Start a new request.' }, 409);
        // Consume before reading or verification, including failure/cancellation; no replay.
        sessions.delete(id!);
        if (path === '/api/cancel') return json({ canceled: true });
        if (path !== '/api/verify') return json({ error: 'Unknown endpoint' }, 404);
        if (!request.headers.get('Content-Type')?.startsWith('application/json'))
            return json({ error: 'Expected a JSON response' }, 415);
        const reader = request.body?.getReader();
        if (!reader) return json({ error: 'Missing response' }, 400);
        let text = '';
        let size = 0;
        const decoder = new TextDecoder();
        try {
            for (;;) {
                const chunk = await reader.read();
                if (chunk.done) break;
                size += chunk.value.byteLength;
                if (size > 64 * 1024) {
                    await reader.cancel();
                    return json({ error: 'Response too large' }, 413);
                }
                text += decoder.decode(chunk.value, { stream: true });
            }
            text += decoder.decode();
            const result = await verifyDcApiResponse(JSON.parse(text), structuredClone(QUERY), {
                origin,
                nonce: session.nonce,
                responseMode: 'dc_api',
                protocol: 'openid4vp-v1-unsigned',
                allowedAlgorithms: ['EdDSA'],
                trustedIssuerJwks: [ISSUER_JWK],
            });
            if (!result.valid)
                return json({ error: 'The returned credential could not be verified.' }, 422);
            // Return counts/labels, never credential bodies, disclosures or raw library errors.
            return json({
                verified: true,
                verifier: '@openeudi/openid4vp 0.18.0',
                fields: ['Course name', 'Completion date'],
            });
        } catch {
            return json({ error: 'The returned credential could not be verified.' }, 422);
        } finally {
            reader.releaseLock();
        }
    };
};
