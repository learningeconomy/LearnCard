import { resolveTenantFromRequest } from '@learncard/email-templates';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTPayload } from 'jose';
import { authRouter } from '../src/routes/auth';
import { setSocialJwksResolverForTests } from '../src/helpers/social-token.helpers';
import type { MongoAuthSubjectType } from '../src/models/AuthSubject';

const { env, store, subjects, rates } = vi.hoisted(() => ({
    env: { GOOGLE_OAUTH_CLIENT_IDS: 'google-client', APPLE_OAUTH_CLIENT_IDS: 'apple-client' },
    store: new Map<string, string>(),
    subjects: new Map<string, MongoAuthSubjectType>(),
    rates: new Map<string, number>(),
}));
vi.mock('@environment', () => ({ environment: env }));
vi.mock('@routes', async () => {
    const { initTRPC } = await import('@trpc/server');
    const t = initTRPC.context<{ clientIp: string }>().meta<{ openapi: unknown }>().create();
    return { t, openRoute: t.procedure };
});
vi.mock('@mongo', () => ({
    default: {
        collection: () => ({
            createIndex: vi.fn(async () => 'index'),
            findOneAndUpdate: vi.fn(
                async (
                    filter: { identityKey: string },
                    update: {
                        $setOnInsert: MongoAuthSubjectType;
                        $set: Partial<MongoAuthSubjectType>;
                    }
                ) => {
                    const record = {
                        ...(subjects.get(filter.identityKey) ?? update.$setOnInsert),
                        ...update.$set,
                    };
                    subjects.set(filter.identityKey, record);
                    return record;
                }
            ),
        }),
    },
}));
vi.mock('@cache', () => ({
    default: {
        get: async (key: string) => store.get(key),
        set: async (key: string, value: string) => {
            store.set(key, value);
        },
        delete: async (keys: string[]) => {
            keys.forEach(key => store.delete(key));
        },
        node: {
            incr: async (key: string) => {
                const count = (rates.get(key) ?? 0) + 1;
                rates.set(key, count);
                return count;
            },
            expire: vi.fn(async () => 1),
        },
    },
}));

let keys: Awaited<ReturnType<typeof generateKeyPair>>;
const caller = () =>
    authRouter.createCaller({
        clientIp: 'test-ip',
        domain: 'localhost',
        tenant: resolveTenantFromRequest({}),
    });
const sign = (claims: JWTPayload = {}) =>
    new SignJWT({
        sub: 'social-sub',
        iss: 'https://accounts.google.com',
        aud: 'google-client',
        email: 'test@example.com',
        email_verified: true,
        exp: Math.floor(Date.now() / 1000) + 300,
        ...claims,
    })
        .setProtectedHeader({ alg: 'RS256', kid: 'social-key' })
        .sign(keys.privateKey);
const payload = (ticket: string | undefined): Record<string, unknown> =>
    JSON.parse(store.get(`login-ticket:${ticket}`)!);
const emailLogin = async (email = 'test@example.com') => {
    store.set(`login-code:${email.trim()}:123456`, '1');
    return caller().requestLoginTicket({ email, code: '123456' });
};
beforeAll(async () => {
    keys = await generateKeyPair('RS256');
    const jwks = createLocalJWKSet({
        keys: [{ ...(await exportJWK(keys.publicKey)), kid: 'social-key' }],
    });
    setSocialJwksResolverForTests(() => jwks);
});
beforeEach(() => {
    store.clear();
    subjects.clear();
    rates.clear();
    env.GOOGLE_OAUTH_CLIENT_IDS = 'google-client';
    env.APPLE_OAUTH_CLIENT_IDS = 'apple-client';
});

describe('auth login tickets', () => {
    it('consumes a valid code and issues a random ticket', async () => {
        const result = await emailLogin();
        expect(result.success).toBe(true);
        expect(result.ticket).toMatch(/^[A-Za-z0-9_-]{43}$/);
        expect(store.has('login-code:test@example.com:123456')).toBe(false);
        expect(payload(result.ticket)).toMatchObject({
            identityKey: 'email:test@example.com',
            emailVerified: true,
        });
    });
    it('returns a safe failure for invalid codes', async () => {
        expect(
            await caller().requestLoginTicket({ email: 'test@example.com', code: '000000' })
        ).toEqual({ success: false, error: 'Invalid or expired code.' });
    });
    it('rejects code replay', async () => {
        await emailLogin();
        expect(
            (await caller().requestLoginTicket({ email: 'test@example.com', code: '123456' }))
                .success
        ).toBe(false);
    });
    it('reuses the subject for the same email', async () => {
        const first = payload((await emailLogin()).ticket);
        const second = payload((await emailLogin()).ticket);
        expect(first.subject).toBe(second.subject);
        expect(first.subject).toMatch(/^[0-9a-f-]{14}4[0-9a-f-]{21}$/);
    });
    it('normalizes case/whitespace for identity, not the original code lookup', async () => {
        const first = payload((await emailLogin()).ticket);
        const second = payload((await emailLogin(' Test@Example.com ')).ticket);
        expect(second.identityKey).toBe('email:test@example.com');
        expect(second.subject).toBe(first.subject);
    });
    it('does not accept a differently-cased code cache key', async () => {
        store.set('login-code:test@example.com:123456', '1');
        expect(
            (await caller().requestLoginTicket({ email: 'Test@Example.com', code: '123456' }))
                .success
        ).toBe(false);
    });
    it('creates different UUIDs for different identities', async () => {
        expect(payload((await emailLogin()).ticket).subject).not.toBe(
            payload((await emailLogin('other@example.com')).ticket).subject
        );
    });
    it('accepts Google and keys it by Google subject, not email', async () => {
        const result = await caller().requestSocialLoginTicket({
            provider: 'google',
            idToken: await sign({ name: 'Name', picture: 'https://p.test' }),
        });
        expect(result.success).toBe(true);
        expect(payload(result.ticket)).toMatchObject({
            identityKey: 'google:social-sub',
            name: 'Name',
            picture: 'https://p.test',
        });
        expect(subjects.get('google:social-sub')).toMatchObject({
            displayName: 'Name',
            pictureUrl: 'https://p.test',
        });
    });
    it.each([
        { email_verified: false },
        { email_verified: 'true' },
        { aud: 'wrong' },
        { iss: 'https://wrong.test' },
        { email: undefined },
        { sub: '' },
        { exp: 1 },
    ])('rejects invalid Google proof %j', async claims => {
        const result = await caller().requestSocialLoginTicket({
            provider: 'google',
            idToken: await sign(claims),
        });
        expect(result.success).toBe(false);
        expect(result.ticket).toBeUndefined();
        expect(subjects.size).toBe(0);
    });
    it('accepts Apple string true and relay addresses', async () => {
        const result = await caller().requestSocialLoginTicket({
            provider: 'apple',
            idToken: await sign({
                iss: 'https://appleid.apple.com',
                aud: 'apple-client',
                email_verified: 'true',
                email: 'x@privaterelay.appleid.com',
            }),
        });
        expect(result.success).toBe(true);
        expect(payload(result.ticket).identityKey).toBe('apple:social-sub');
    });
    it('returns a friendly unconfigured-provider error', async () => {
        env.GOOGLE_OAUTH_CLIENT_IDS = '';
        expect(
            await caller().requestSocialLoginTicket({ provider: 'google', idToken: 'unused' })
        ).toEqual({ success: false, error: 'Sign-in with google is not configured.' });
    });
    it('does not merge email and social identities', async () => {
        const first = payload((await emailLogin()).ticket);
        const second = payload(
            (await caller().requestSocialLoginTicket({ provider: 'google', idToken: await sign() }))
                .ticket
        );
        expect(first.subject).not.toBe(second.subject);
    });
    it.each(['email', 'social'])('rate limits the %s endpoint per IP', async provider => {
        for (let index = 0; index < 10; index++) {
            if (provider === 'email') await emailLogin();
            else
                await caller().requestSocialLoginTicket({
                    provider: 'google',
                    idToken: await sign(),
                });
        }
        const attempt =
            provider === 'email'
                ? emailLogin()
                : caller().requestSocialLoginTicket({ provider: 'google', idToken: await sign() });
        await expect(attempt).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
    });
});
