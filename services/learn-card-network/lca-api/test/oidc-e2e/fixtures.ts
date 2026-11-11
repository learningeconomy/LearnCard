import { readFileSync } from 'node:fs';
import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';
import { test as base, expect, type Browser, type APIRequestContext } from '@playwright/test';
import { MongoClient } from 'mongodb';
import Redis from 'ioredis';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { OidcE2eRuntime, LoginTicketResult, TestAccount } from './types';

if (!process.env.OIDC_E2E_RUNTIME) throw new Error('Run this suite via bun run test:oidc:e2e');
export const runtime: OidcE2eRuntime = JSON.parse(
    readFileSync(process.env.OIDC_E2E_RUNTIME, 'utf8')
);
const mongo = new MongoClient(runtime.mongoUri);
export const subjects = mongo.db(runtime.mongoDbName).collection('authsubjects');
export const redis = new Redis({ host: '127.0.0.1', port: runtime.redisPort, lazyConnect: true });
const jwks = createRemoteJWKSet(new URL(`${runtime.issuer}/protocol/openid-connect/certs`));

/** Admin calls can only target the ephemeral realm created by the runner. */
export const admin = async (path: string, init?: RequestInit): Promise<Response> => {
    const tokenResponse = await fetch(
        `${runtime.keycloakUrl}/realms/master/protocol/openid-connect/token`,
        {
            method: 'POST',
            body: new URLSearchParams({
                grant_type: 'password',
                client_id: 'admin-cli',
                username: 'admin',
                password: runtime.adminPassword,
            }),
        }
    );
    expect(tokenResponse.ok).toBe(true);
    const { access_token } = await tokenResponse.json();
    return fetch(`${runtime.keycloakUrl}/admin/realms/learncard-oidc-e2e/${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${access_token}`,
            ...init?.headers,
        },
    });
};

export const usersFor = async (email: string): Promise<{ id: string }[]> => {
    const response = await admin(`users?${new URLSearchParams({ email, exact: 'true' })}`);
    expect(response.ok).toBe(true);
    return response.json();
};

const cleanupAccount = async ({ email, identityKey }: TestAccount): Promise<void> => {
    const cleanup = await Promise.allSettled([
        (async () => {
            for (const user of await usersFor(email)) {
                expect((await admin(`users/${user.id}`, { method: 'DELETE' })).status).toBe(204);
            }
            expect(await usersFor(email)).toEqual([]);
        })(),
        (async () => {
            await subjects.deleteMany({ identityKey });
            expect(await subjects.countDocuments({ identityKey })).toBe(0);
        })(),
        // The runner provisions a private Redis container and this config has
        // one worker. Clear all transient tickets/codes/tokens/rate counters.
        (async () => {
            await redis.flushdb();
            expect(await redis.dbsize()).toBe(0);
        })(),
    ]);
    const failures = cleanup.filter(result => result.status === 'rejected');
    if (failures.length)
        throw new AggregateError(
            failures.map(result => result.reason),
            'Per-test cleanup failed'
        );
};

export const test = base.extend<{ account: TestAccount }>({
    // Playwright requires a destructured fixture argument even with no dependencies.
    // eslint-disable-next-line no-empty-pattern
    account: async ({}, provideAccount) => {
        const email = `oidc-e2e-${randomUUID()}@example.com`;
        const identityKey = `email:${email}`;
        try {
            await provideAccount({ email, identityKey });
        } finally {
            // Exact test identity, never a broad user deletion. Deleting the user also
            // removes sessions and federated links. The outer runner independently
            // destroys all three disposable stores even if any of these actions fail.
            await cleanupAccount({ email, identityKey });
        }
    },
});

test.beforeAll(async () => {
    await Promise.all([mongo.connect(), redis.connect()]);
});
test.afterAll(async () => {
    await Promise.all([mongo.close(), redis.quit()]);
});

export const redeemCode = async (
    request: APIRequestContext,
    email: string,
    code: string
): Promise<LoginTicketResult> => {
    const response = await request.post(`${runtime.apiUrl}/api/auth/login-ticket`, {
        data: { email, code },
    });
    expect(response.ok()).toBe(true);
    return response.json();
};

export const issueTicket = async (request: APIRequestContext, email: string): Promise<string> => {
    // Seed only the email delivery boundary. All code validation, identity creation,
    // ticket issuance and token exchange go through real HTTP routes and stores.
    const code = String(randomInt(100_000, 1_000_000));
    await redis.set(`login-code:${email}`, code, 'EX', 300);
    const result = await redeemCode(request, email, code);
    expect(result.success).toBe(true);
    expect(result.ticket).toBeTruthy();
    expect(await redis.exists(`login-code:${email}`)).toBe(0);
    expect(await redis.ttl(`login-ticket:${result.ticket}`)).toBeGreaterThan(0);
    expect(await redis.ttl(`login-ticket:${result.ticket}`)).toBeLessThanOrEqual(60);
    return result.ticket!;
};

const authorization = (
    ticket: string
): { url: string; verifier: string; nonce: string; state: string } => {
    const verifier = randomBytes(32).toString('base64url');
    const nonce = randomUUID();
    const state = randomUUID();
    const params = new URLSearchParams({
        client_id: 'learncard-app',
        redirect_uri: runtime.callbackUrl,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        nonce,
        code_challenge: createHash('sha256').update(verifier).digest('base64url'),
        code_challenge_method: 'S256',
        kc_idp_hint: 'lca-api',
        login_hint: ticket,
    });
    return {
        url: `${runtime.issuer}/protocol/openid-connect/auth?${params}`,
        verifier,
        nonce,
        state,
    };
};

/** Fresh context on every attempt prevents an existing SSO cookie hiding a broken ticket flow. */
export const completeLogin = async (
    browser: Browser,
    ticket: string,
    email: string
): Promise<string> => {
    const context = await browser.newContext();
    try {
        const page = await context.newPage();
        const auth = authorization(ticket);
        await page.goto(auth.url);
        // There are no form-filling/clicking actions: an unexpected login, profile,
        // or account-linking form cannot satisfy this callback assertion.
        await page.waitForURL(url => `${url.origin}${url.pathname}` === runtime.callbackUrl);
        const callback = new URL(page.url());
        expect(callback.searchParams.get('error')).toBeNull();
        expect(callback.searchParams.get('state')).toBe(auth.state);
        const code = callback.searchParams.get('code');
        expect(code).toBeTruthy();
        expect(await redis.exists(`login-ticket:${ticket}`)).toBe(0);
        const response = await context.request.post(
            `${runtime.issuer}/protocol/openid-connect/token`,
            {
                form: {
                    grant_type: 'authorization_code',
                    client_id: 'learncard-app',
                    code: code!,
                    redirect_uri: runtime.callbackUrl,
                    code_verifier: auth.verifier,
                },
            }
        );
        expect(response.ok()).toBe(true);
        const tokens = await response.json();
        const { payload } = await jwtVerify(tokens.id_token, jwks, {
            issuer: runtime.issuer,
            audience: 'learncard-app',
            algorithms: ['RS256'],
            requiredClaims: ['sub', 'exp', 'iat', 'nonce'],
        });
        expect(payload).toMatchObject({ email, email_verified: true, nonce: auth.nonce });
        expect(payload.sub).toBeTruthy();
        const userinfo = await context.request.get(
            `${runtime.issuer}/protocol/openid-connect/userinfo`,
            {
                headers: { Authorization: `Bearer ${tokens.access_token}` },
            }
        );
        expect(userinfo.ok()).toBe(true);
        expect(await userinfo.json()).toMatchObject({ sub: payload.sub, email });
        const record = await subjects.findOne({ identityKey: `email:${email}` });
        expect(record?.subject).toBeTruthy();
        const links = await admin(`users/${payload.sub}/federated-identity`);
        expect(links.ok).toBe(true);
        expect(await links.json()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ identityProvider: 'lca-api', userId: record!.subject }),
            ])
        );
        expect(await usersFor(email)).toEqual([expect.objectContaining({ id: payload.sub })]);
        return payload.sub!;
    } finally {
        await context.close();
    }
};

export const rejectTicket = async (browser: Browser, ticket: string): Promise<void> => {
    const context = await browser.newContext();
    try {
        const page = await context.newPage();
        const upstream = page.waitForResponse(response => {
            const url = new URL(response.url());
            return url.origin === runtime.apiUrl && url.pathname === '/oidc/authorize';
        });
        const auth = authorization(ticket);
        await page.goto(auth.url);
        const response = await upstream;
        expect(response.status()).toBe(302);
        const location = new URL(response.headers().location!);
        expect(`${location.origin}${location.pathname}`).toBe(
            `${runtime.issuer}/broker/lca-api/endpoint`
        );
        expect(location.searchParams.get('error')).toBe('login_required');
        expect(location.searchParams.get('code')).toBeNull();
        await page.waitForURL(url => `${url.origin}${url.pathname}` === runtime.callbackUrl);
        const callback = new URL(page.url());
        expect(callback.searchParams.get('error')).toBeTruthy();
        expect(callback.searchParams.get('code')).toBeNull();
        expect(callback.searchParams.get('state')).toBe(auth.state);
    } finally {
        await context.close();
    }
};
