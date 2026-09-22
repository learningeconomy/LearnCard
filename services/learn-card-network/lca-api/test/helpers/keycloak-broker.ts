import { createHash, randomBytes, randomUUID } from 'node:crypto';
import Redis from 'ioredis';
import { z } from 'zod';

export const roundtripEnabled =
    process.env.KEYCLOAK_INTEGRATION === 'true' && process.env.KEYCLOAK_ROUNDTRIP === 'true';
export const apiOrigin = process.env.OIDC_ISSUER ?? 'http://localhost:5100';
export const keycloakIssuer =
    process.env.KEYCLOAK_ISSUERS?.split(',')[0] ?? 'http://localhost:8081/realms/learncard';
const callback = 'http://localhost:3000/login';

export const trpc = async (route: string, input: unknown): Promise<unknown> => {
    const response = await fetch(`${apiOrigin}/trpc/${route}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': 'learncard' },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`tRPC ${route}: HTTP ${response.status}`);
    const envelope = z
        .object({ result: z.object({ data: z.unknown() }) })
        .parse(await response.json());
    return envelope.result.data;
};

interface Cookie {
    name: string;
    value: string;
    path: string;
    origin: string;
    secure: boolean;
}

/** Follow only the two configured origins, never logging tickets, codes or cookies. */
export const walkBrokerRedirects = async (
    start: URL
): Promise<{ code: string; trace: string[]; state: string }> => {
    const cookies = new Map<string, Cookie>();
    const trace: string[] = [];
    let url = start;
    for (let hop = 0; hop < 12; hop++) {
        if (!new Set([new URL(keycloakIssuer).origin, new URL(apiOrigin).origin]).has(url.origin)) {
            throw new Error('Unexpected broker redirect origin');
        }
        const cookie = [...cookies.values()]
            .filter(
                item =>
                    item.origin === url.origin &&
                    (url.pathname === item.path ||
                        url.pathname.startsWith(
                            item.path.endsWith('/') ? item.path : `${item.path}/`
                        )) &&
                    // Browsers allow Secure cookies on localhost (Keycloak emits them even in dev).
                    (!item.secure || url.protocol === 'https:' || url.hostname === 'localhost')
            )
            .map(item => `${item.name}=${item.value}`)
            .join('; ');
        const response = await fetch(url, {
            redirect: 'manual',
            headers: { cookie },
            signal: AbortSignal.timeout(15_000),
        });
        for (const serialized of response.headers.getSetCookie()) {
            const [pair = '', ...attributes] = serialized.split(';').map(value => value.trim());
            const index = pair.indexOf('=');
            const name = pair.slice(0, index);
            const value = pair.slice(index + 1);
            const path = attributes.find(attr => /^path=/i.test(attr))?.slice(5) || '/';
            const key = `${url.origin}:${path}:${name}`;
            if (attributes.some(attr => /^max-age=0$/i.test(attr))) cookies.delete(key);
            else
                cookies.set(key, {
                    name,
                    value,
                    path,
                    origin: url.origin,
                    secure: attributes.some(attr => /^secure$/i.test(attr)),
                });
        }
        if (response.status < 300 || response.status >= 400) {
            const title =
                (await response.text()).match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? '(no title)';
            throw new Error(
                `Broker rendered HTTP ${response.status} at ${url.pathname}; title: ${title}; trace: ${trace.join(' → ')}`
            );
        }
        const location = response.headers.get('location');
        if (!location) throw new Error('Broker redirect lacks Location');
        const next = new URL(location, url);
        trace.push(
            `${response.status} ${url.origin}${url.pathname} → ${next.origin}${next.pathname}`
        );
        await response.body?.cancel();
        if (`${next.origin}${next.pathname}` === callback) {
            const code = next.searchParams.get('code');
            const state = next.searchParams.get('state');
            if (!code || !state || next.searchParams.has('error'))
                throw new Error('Broker callback lacks a successful code/state');
            return { code, state, trace };
        }
        url = next;
    }
    throw new Error('Broker exceeded 12 redirect hops');
};

/** Real OTP ticket → broker → lca-api → broker callback → PKCE token exchange. */
export const signInThroughBroker = async (
    email: string
): Promise<{ idToken: string; trace: string[] }> => {
    if (!process.env.REDIS_HOST || !process.env.REDIS_PORT)
        throw new Error('Set live API REDIS_HOST/REDIS_PORT explicitly');
    const redis = new Redis({
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        maxRetriesPerRequest: 1,
    });
    const code = String(randomBytes(4).readUInt32BE() % 1_000_000).padStart(6, '0');
    const key = `login-code:${email}:${code}`;
    let ticket: string;
    try {
        await redis.set(key, 'true', 'EX', 60);
        const result = z
            .object({ success: z.literal(true), ticket: z.string() })
            .parse(await trpc('auth.requestLoginTicket', { email, code }));
        ticket = result.ticket;
        if (await redis.exists(key)) throw new Error('Login code was not consumed');
    } finally {
        await redis.del(key);
        await redis.quit();
    }
    const verifier = randomBytes(32).toString('base64url');
    const state = randomUUID();
    const params = new URLSearchParams({
        client_id: 'learncard-app',
        response_type: 'code',
        scope: 'openid email profile phone',
        redirect_uri: callback,
        state,
        code_challenge: createHash('sha256').update(verifier).digest('base64url'),
        code_challenge_method: 'S256',
        kc_idp_hint: 'lca-api',
        login_hint: ticket,
    });
    const result = await walkBrokerRedirects(
        new URL(`${keycloakIssuer}/protocol/openid-connect/auth?${params}`)
    );
    if (result.state !== state) throw new Error('Broker state mismatch');
    const response = await fetch(`${keycloakIssuer}/protocol/openid-connect/token`, {
        method: 'POST',
        signal: AbortSignal.timeout(15_000),
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: 'learncard-app',
            code: result.code,
            redirect_uri: callback,
            code_verifier: verifier,
        }),
    });
    if (!response.ok) throw new Error(`PKCE exchange failed (${response.status})`);
    const tokens = z.object({ id_token: z.string() }).parse(await response.json());
    process.stdout.write(`Broker hop trace:\n${result.trace.join('\n')}\n`);
    return { idToken: tokens.id_token, trace: result.trace };
};
