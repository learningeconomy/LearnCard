import { describe, it, expect } from 'vitest';

import type { DashboardSession } from '@learncard/types';

import { buildServer } from '../src/server';
import type { ConsoleAuthService } from '../src/app';
import { SESSION_COOKIE_NAME, readSessionCookie } from '@session';
import { StubBrainServiceTransport } from '../src/brain/stub-transport';
import { LocalKeyManagementService } from '@kms/local';
import { InMemoryKeyDirectory } from '@did';

const COOKIE_SECRET = 'test-secret';

// Required by ConsoleBffServerConfig but unexercised by these HTTP-surface tests.
const stubSpineDeps = () => ({
    transport: new StubBrainServiceTransport(),
    kms: new LocalKeyManagementService(),
    keyRefFor: async () => null,
    directory: new InMemoryKeyDirectory(),
    consoleDomain: 'localhost:3200',
});

const stubSession = (sessionId: string): DashboardSession => ({
    sessionId,
    tenantId: 'lef',
    providerId: 'lef-wallet',
    providerKind: 'auth-coordinator',
    externalSubject: 'sub',
    profileId: 'profile-1',
    managedDid: 'did:web:console.lef.org:p:1',
    effectiveAccess: { ecosystemRoles: [], scopes: [] },
    authTime: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    assuranceLevel: 'mfa',
});

const stubAuthService = () =>
    ({
        async completeLogin() {
            return stubSession('sid-123');
        },
    } as unknown as ConsoleAuthService);

describe('console-bff HTTP server', () => {
    it('sets a signed, httpOnly, secure, lax, path-scoped session cookie on callback', async () => {
        const app = buildServer({
            ...stubSpineDeps(),
            authService: stubAuthService(),
            cookieSecret: COOKIE_SECRET,
            secureCookies: true,
        });

        const res = await app.inject({
            method: 'POST',
            url: '/auth/callback',
            payload: { providerId: 'lef-wallet', params: { vp: 'z1' } },
        });

        expect(res.statusCode).toBe(200);

        const setCookie = res.headers['set-cookie'];
        const cookieStr = Array.isArray(setCookie) ? setCookie.join(';') : String(setCookie);

        expect(cookieStr).toContain(`${SESSION_COOKIE_NAME}=`);
        expect(cookieStr).toMatch(/HttpOnly/i);
        expect(cookieStr).toMatch(/Secure/i);
        expect(cookieStr).toMatch(/SameSite=Lax/i);
        expect(cookieStr).toMatch(/Path=\//i);

        const rawValue = cookieStr.split(`${SESSION_COOKIE_NAME}=`)[1]!.split(';')[0]!;
        expect(readSessionCookie(decodeURIComponent(rawValue), COOKIE_SECRET)).toBe('sid-123');

        await app.close();
    });

    it('health check responds ok', async () => {
        const app = buildServer({
            ...stubSpineDeps(),
            authService: stubAuthService(),
            cookieSecret: COOKIE_SECRET,
        });

        const res = await app.inject({ method: 'GET', url: '/health' });

        expect(res.json()).toEqual({ status: 'ok' });

        await app.close();
    });
});

describe('console-bff tRPC batching', () => {
    // httpBatchLink joins every procedure name into one path segment, so a modest
    // batch easily exceeds Fastify's default maxParamLength of 100 and 404s.
    it('routes a batched request whose joined procedure path exceeds 100 characters', async () => {
        const app = buildServer({
            ...stubSpineDeps(),
            authService: stubAuthService(),
            cookieSecret: COOKIE_SECRET,
        });

        const procedures = [
            'installIntents.getInstallIntent',
            'installIntents.getInstallIntentAuditEvents',
            'installIntents.getInstallIntent',
            'installIntents.getInstallIntentAuditEvents',
        ].join(',');

        expect(procedures.length).toBeGreaterThan(100);

        const input = encodeURIComponent(
            JSON.stringify(Object.fromEntries([0, 1, 2, 3].map(i => [i, { intentId: 'i1' }])))
        );

        const res = await app.inject({
            method: 'GET',
            url: `/trpc/${procedures}?batch=1&input=${input}`,
        });

        expect(res.statusCode).not.toBe(404);

        await app.close();
    });
});
