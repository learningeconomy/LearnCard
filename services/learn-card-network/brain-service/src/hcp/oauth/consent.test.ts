/**
 * DID-authenticated OAuth consent: authorize -> app ticket -> brain approve (issues a
 * grant to the client's derived DID) -> consent assertion -> complete -> code -> token.
 * The brain side runs the real approveOAuthRequest service against the memory harness;
 * the v1 router's DID auth around it is covered in test/hcp-v1.spec.ts.
 */
import { createServer, type Server } from 'node:http';
import { SignJWT, decodeJwt } from 'jose';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { listAudit } from '../v1/service/governance';
import { revokeGrant } from '../v1/service/grants';
import {
    CONSENT_ASSERTION_TYP,
    OAUTH_GRANT_DURATION_MS,
    OAUTH_GRANT_PURPOSE_CODE,
    OAUTH_REQUEST_AUDIENCE,
    approveOAuthRequest,
    signConsentAssertion,
    verifyConsentAssertion,
} from '../v1/service/oauth-consent';
import { SUBJECT_DID, makeHarness, subject } from '../v1/service/test-harness';
import type { HcpV1Caller } from '../v1/service/deps';
import { createHcpMcpApp, HCP_MCP_PATH } from '../mcp/app';
import { createHcpOAuthApp } from './app';
import { deriveOAuthClientDid } from './client-did';
import { DEFAULT_SCOPES_SUPPORTED } from './metadata';
import { createCodeChallenge, createCodeVerifier } from './pkce';
import { resolveBearerToGrant } from './rs';
import type { TokenSignerConfig } from './tokens';

const SECRET = 'unit-test-hcp-consent-secret-32bytes!';
const APP_URL = 'http://app.test';
const formBody = (fields: Record<string, string>) => new URLSearchParams(fields).toString();
const key = new TextEncoder().encode(SECRET);

const freePort = async (): Promise<number> => {
    const probe = createServer();
    await new Promise<void>(resolve => probe.listen(0, '127.0.0.1', resolve));
    const address = probe.address();
    if (!address || typeof address === 'string') throw new Error('expected TCP port');
    await new Promise<void>((resolve, reject) =>
        probe.close(error => (error ? reject(error) : resolve()))
    );
    return address.port;
};

const close = (server: Server) =>
    new Promise<void>((resolve, reject) =>
        server.close(error => (error ? reject(error) : resolve()))
    );

describe('deriveOAuthClientDid', () => {
    it('is stable, keeps the port as %3A, and names the client', () => {
        const did = deriveOAuthClientDid('http://127.0.0.1:18767', 'hcp_oauth_0123abcd');
        expect(did).toBe('did:web:127.0.0.1%3A18767:hcp:oauth-clients:hcp_oauth_0123abcd');
        expect(deriveOAuthClientDid('http://127.0.0.1:18767/', 'hcp_oauth_0123abcd')).toBe(did);
        expect(deriveOAuthClientDid('https://Brain.Example', 'hcp_oauth_x')).toBe(
            'did:web:brain.example:hcp:oauth-clients:hcp_oauth_x'
        );
        expect(deriveOAuthClientDid('http://127.0.0.1:18767', 'hcp_oauth_other')).not.toBe(did);
    });

    it('hashes a client_id that is not DID-safe', () => {
        const did = deriveOAuthClientDid('https://brain.example', 'a b:c/d');
        expect(did).toMatch(/^did:web:brain\.example:hcp:oauth-clients:[A-Za-z0-9_-]{43}$/);
        expect(deriveOAuthClientDid('https://brain.example', 'a b:c/d')).toBe(did);
    });
});

describe('HCP OAuth DID-authenticated consent', () => {
    const harness = makeHarness();
    let server: Server;
    let baseUrl = '';
    let config: { issuerUrl: string; secret: string };
    let tokenConfig: TokenSignerConfig;

    beforeAll(async () => {
        const port = await freePort();
        baseUrl = `http://127.0.0.1:${port}`;
        config = { issuerUrl: baseUrl, secret: SECRET };
        tokenConfig = { secret: SECRET, issuerUrl: baseUrl, resourceUrl: baseUrl };
        server = createServer(
            createHcpMcpApp({
                store: harness.store,
                hcp: harness.deps,
                issuerUrl: baseUrl,
                resourceUrl: baseUrl,
                tokenSecret: SECRET,
                now: harness.deps.now,
                consentAppUrl: APP_URL,
            })
        );
        await new Promise<void>((resolve, reject) => {
            server.listen(port, '127.0.0.1', resolve);
            server.on('error', reject);
        });
    });

    afterAll(() => close(server));

    const register = async (redirectUri: string, name = 'Claude Code (test)') => {
        const res = await fetch(`${baseUrl}/oauth/register`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ redirect_uris: [redirectUri], client_name: name }),
        });
        expect(res.status).toBe(201);
        return ((await res.json()) as { client_id: string }).client_id;
    };

    /** Authorize; returns the app handoff URL and its ticket. */
    const authorize = async (opts: {
        clientId: string;
        redirectUri: string;
        scope?: string;
        verifier: string;
    }) => {
        const url = new URL(`${baseUrl}/oauth/authorize`);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('client_id', opts.clientId);
        url.searchParams.set('redirect_uri', opts.redirectUri);
        url.searchParams.set('code_challenge', createCodeChallenge(opts.verifier));
        url.searchParams.set('code_challenge_method', 'S256');
        url.searchParams.set('resource', baseUrl);
        url.searchParams.set('state', 'st');
        if (opts.scope) url.searchParams.set('scope', opts.scope);
        const res = await fetch(url, { redirect: 'manual' });
        return { res, location: res.headers.get('location') };
    };

    const ticketFrom = (location: string | null): string => {
        const url = new URL(location!);
        expect(`${url.origin}${url.pathname}`).toBe(`${APP_URL}/hcp/connect`);
        return url.searchParams.get('oauth_request')!;
    };

    const complete = (assertion: string | null) =>
        fetch(
            `${baseUrl}/oauth/consent/complete${assertion === null ? '' : `?assertion=${encodeURIComponent(assertion)}`}`,
            { redirect: 'manual' }
        );

    const exchange = async (opts: {
        location: string;
        clientId: string;
        redirectUri: string;
        verifier: string;
    }) => {
        const code = new URL(opts.location).searchParams.get('code');
        expect(code).toBeTruthy();
        const res = await fetch(`${baseUrl}/oauth/token`, {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: formBody({
                grant_type: 'authorization_code',
                code: code!,
                redirect_uri: opts.redirectUri,
                client_id: opts.clientId,
                code_verifier: opts.verifier,
                resource: baseUrl,
            }),
        });
        expect(res.status).toBe(200);
        return (await res.json()) as { access_token: string; scope: string };
    };

    /** Register + authorize + approve as `caller`; returns everything a test needs. */
    const approved = async (opts: {
        redirectUri: string;
        scope?: string;
        caller?: HcpV1Caller;
    }) => {
        const clientId = await register(opts.redirectUri);
        const verifier = createCodeVerifier();
        const { location } = await authorize({ ...opts, clientId, verifier });
        const ticket = ticketFrom(location);
        const approval = await approveOAuthRequest(
            harness.deps,
            opts.caller ?? subject,
            { ticket },
            config
        );
        const assertion = new URL(approval.completeUrl).searchParams.get('assertion')!;
        return { clientId, verifier, ticket, approval, assertion };
    };

    it('hands authorize off to the app with a signed ticket naming client, DID and scopes', async () => {
        const clientId = await register('http://127.0.0.1/cb-ticket', 'Claude Code');
        const { res, location } = await authorize({
            clientId,
            redirectUri: 'http://127.0.0.1/cb-ticket',
            scope: 'hcp:general_preferences:read',
            verifier: createCodeVerifier(),
        });
        expect(res.status).toBe(302);
        const claims = decodeJwt(ticketFrom(location));
        expect(claims).toMatchObject({
            typ: 'hcp-oauth-request',
            iss: baseUrl,
            aud: OAUTH_REQUEST_AUDIENCE,
            client_id: clientId,
            client_name: 'Claude Code',
            client_did: deriveOAuthClientDid(baseUrl, clientId),
            scope: 'hcp:general_preferences:read',
        });
        expect(claims.exp! - claims.iat!).toBe(600);
    });

    it('fills an empty scope with every PRM scope, and refuses scopes it does not issue', async () => {
        const clientId = await register('http://127.0.0.1/cb-default');
        const { location } = await authorize({
            clientId,
            redirectUri: 'http://127.0.0.1/cb-default',
            verifier: createCodeVerifier(),
        });
        expect(decodeJwt(ticketFrom(location)).scope).toBe(
            [...DEFAULT_SCOPES_SUPPORTED].sort().join(' ')
        );

        const bad = await authorize({
            clientId,
            redirectUri: 'http://127.0.0.1/cb-default',
            scope: 'hcp:health_context:write',
            verifier: createCodeVerifier(),
        });
        expect(bad.res.status).toBe(400);
        expect(((await bad.res.json()) as { error: string }).error).toBe('invalid_scope');
    });

    it('happy path: approve issues a grant to the derived DID; the token binds to it', async () => {
        const redirectUri = 'http://127.0.0.1/cb-happy';
        const scope = 'hcp:general_preferences:read hcp:general_preferences:write';
        const { clientId, verifier, approval, assertion } = await approved({ redirectUri, scope });
        const clientDid = deriveOAuthClientDid(baseUrl, clientId);

        const grant = (await harness.store.getGrant(approval.grantId))!;
        expect(grant).toMatchObject({
            subjectDid: SUBJECT_DID,
            client: { id: clientDid, name: 'Claude Code (test)' },
            grantType: 'temporary',
            expiresAt: new Date(harness.deps.now().getTime() + 60 * 60 * 1000).toISOString(),
            canWrite: false,
            status: 'active',
        });
        expect(grant.access).toEqual([
            expect.objectContaining({
                actions: ['read', 'write'],
                categories: ['general_preferences'],
                purposes: [expect.objectContaining({ code: OAUTH_GRANT_PURPOSE_CODE })],
            }),
        ]);
        // Recorded like grants.create: a grant.issued event by the subject.
        const audit = await listAudit(harness.deps, subject, {
            grantId: approval.grantId,
            limit: 50,
        });
        expect(
            audit.events.some(e => e.eventType === 'grant.issued' && e.grantId === approval.grantId)
        ).toBe(true);

        const verified = await verifyConsentAssertion(config, assertion);
        expect(verified).toEqual({
            ok: true,
            claims: {
                requestId: expect.any(String),
                grantId: approval.grantId,
                subjectDid: SUBJECT_DID,
            },
        });
        const decoded = decodeJwt(assertion);
        expect(decoded).toMatchObject({ typ: CONSENT_ASSERTION_TYP, aud: baseUrl });
        expect(decoded.exp! - decoded.iat!).toBe(120);
        expect(decoded.jti).toBeTruthy();

        const done = await complete(assertion);
        expect(done.status).toBe(302);
        const location = done.headers.get('location')!;
        expect(new URL(location).searchParams.get('state')).toBe('st');
        const token = await exchange({ location, clientId, redirectUri, verifier });
        expect(token.scope).toBe(scope);
        expect(decodeJwt(token.access_token)).toMatchObject({
            sub: clientDid,
            grant_id: approval.grantId,
            client_id: clientId,
        });

        const resolved = await resolveBearerToGrant(harness.deps, tokenConfig, token.access_token);
        expect(resolved.ok).toBe(true);
        if (resolved.ok) {
            expect(resolved.auth.clientDid).toBe(clientDid);
            expect(resolved.auth.grant.grantId).toBe(approval.grantId);
            expect(resolved.auth.grant.subjectDid).toBe(SUBJECT_DID);
        }
    });

    it('revoking the grant through the normal service stops the token (401 revoked_grant)', async () => {
        const redirectUri = 'http://127.0.0.1/cb-revoke';
        const { clientId, verifier, approval, assertion } = await approved({
            redirectUri,
            scope: 'hcp:education_learner_profile:read',
        });
        const done = await complete(assertion);
        const token = await exchange({
            location: done.headers.get('location')!,
            clientId,
            redirectUri,
            verifier,
        });

        await revokeGrant(harness.deps, subject, approval.grantId);

        const resolved = await resolveBearerToGrant(harness.deps, tokenConfig, token.access_token);
        expect(resolved).toEqual({ ok: false, status: 401, error: 'revoked_grant' });
        const mcp = await fetch(`${baseUrl}${HCP_MCP_PATH}`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                accept: 'application/json, text/event-stream',
                authorization: `Bearer ${token.access_token}`,
            },
            body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
        });
        expect(mcp.status).toBe(401);
    });

    it('the grant subject is always the authenticated caller', async () => {
        const other: HcpV1Caller = {
            did: 'did:key:z6MkOtherPerson',
            subjectDid: 'did:key:z6MkOtherPerson',
        };
        const { approval, assertion } = await approved({
            redirectUri: 'http://127.0.0.1/cb-caller',
            scope: 'hcp:general_preferences:read',
            caller: other,
        });
        expect((await harness.store.getGrant(approval.grantId))!.subjectDid).toBe(
            'did:key:z6MkOtherPerson'
        );
        expect(decodeJwt(assertion).sub).toBe('did:key:z6MkOtherPerson');

        // A profile-less caller (an agent) cannot allow anything.
        const clientId = await register('http://127.0.0.1/cb-agent');
        const { location } = await authorize({
            clientId,
            redirectUri: 'http://127.0.0.1/cb-agent',
            verifier: createCodeVerifier(),
        });
        await expect(
            approveOAuthRequest(
                harness.deps,
                { did: 'did:key:z6MkAgent', subjectDid: null },
                { ticket: ticketFrom(location) },
                config
            )
        ).rejects.toMatchObject({ type: 'scope-denied' });
    });

    it('approve rejects a tampered, wrong-secret, expired, wrong-typ or wrong-issuer ticket', async () => {
        const clientId = await register('http://127.0.0.1/cb-badticket');
        const { location } = await authorize({
            clientId,
            redirectUri: 'http://127.0.0.1/cb-badticket',
            verifier: createCodeVerifier(),
        });
        const ticket = ticketFrom(location);
        const claims = decodeJwt(ticket);
        const sign = (payload: Record<string, unknown>, secret = key) =>
            new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).sign(secret);
        const now = Math.floor(Date.now() / 1000);

        const [head, , sig] = ticket.split('.');
        const tamperedBody = Buffer.from(
            JSON.stringify({ ...claims, client_did: 'did:key:z6MkAttacker' })
        ).toString('base64url');
        const bad = [
            `${head}.${tamperedBody}.${sig}`,
            await sign(claims, new TextEncoder().encode('some-other-secret-32-bytes-long!!')),
            await sign({ ...claims, iat: now - 1200, exp: now - 600 }),
            await sign({ ...claims, typ: CONSENT_ASSERTION_TYP }),
            await sign({ ...claims, iss: 'http://127.0.0.1:1' }),
            await sign({ ...claims, aud: baseUrl }),
            'not-a-jwt',
        ];
        for (const candidate of bad) {
            await expect(
                approveOAuthRequest(harness.deps, subject, { ticket: candidate }, config)
            ).rejects.toMatchObject({ type: 'malformed-request' });
        }
        // The real one still works: nothing above consumed anything.
        await expect(
            approveOAuthRequest(harness.deps, subject, { ticket }, config)
        ).resolves.toMatchObject({ grantId: expect.any(String) });
    });

    it('complete fails without, or with a bad, expired, wrong-aud or wrong-typ assertion', async () => {
        const redirectUri = 'http://127.0.0.1/cb-badassert';
        const { assertion, clientId, verifier } = await approved({
            redirectUri,
            scope: 'hcp:general_preferences:read',
        });
        const claims = decodeJwt(assertion);
        const sign = (payload: Record<string, unknown>, secret = key) =>
            new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).sign(secret);
        const now = Math.floor(Date.now() / 1000);

        const missing = await complete(null);
        expect(missing.status).toBe(400);
        expect(((await missing.json()) as { error: string }).error).toBe('invalid_request');

        const bad = [
            await sign(claims, new TextEncoder().encode('some-other-secret-32-bytes-long!!')),
            await sign({ ...claims, iat: now - 600, exp: now - 300 }),
            await sign({ ...claims, aud: 'http://127.0.0.1:1' }),
            await sign({ ...claims, typ: 'hcp-oauth-request' }),
            'not-a-jwt',
        ];
        for (const candidate of bad) {
            const res = await complete(candidate);
            expect(res.status).toBe(400);
            expect(((await res.json()) as { error: string }).error).toBe('access_denied');
        }

        // Bad assertions consume nothing: the real one still completes.
        const done = await complete(assertion);
        expect(done.status).toBe(302);
        await exchange({
            location: done.headers.get('location')!,
            clientId,
            redirectUri,
            verifier,
        });
    });

    it('complete refuses an assertion whose subject does not own the grant', async () => {
        const { assertion } = await approved({
            redirectUri: 'http://127.0.0.1/cb-sub',
            scope: 'hcp:general_preferences:read',
        });
        const claims = decodeJwt(assertion);
        const forged = await signConsentAssertion(config, {
            requestId: claims.request_id as string,
            grantId: claims.grant_id as string,
            subjectDid: 'did:key:z6MkSomeoneElse',
        });
        const res = await complete(forged);
        expect(res.status).toBe(400);
        expect(((await res.json()) as { error: string }).error).toBe('access_denied');
    });

    it('complete refuses a replayed assertion (the pending request is single-use)', async () => {
        const { assertion } = await approved({
            redirectUri: 'http://127.0.0.1/cb-replay',
            scope: 'hcp:general_preferences:read',
        });
        expect((await complete(assertion)).status).toBe(302);
        const again = await complete(assertion);
        expect(again.status).toBe(400);
        expect(((await again.json()) as { error: string }).error).toBe('invalid_request');
    });

    it("complete refuses a grant issued to a different OAuth client's DID", async () => {
        const a = await approved({
            redirectUri: 'http://127.0.0.1/cb-client-a',
            scope: 'hcp:general_preferences:read',
        });
        const clientB = await register('http://127.0.0.1/cb-client-b');
        const { location } = await authorize({
            clientId: clientB,
            redirectUri: 'http://127.0.0.1/cb-client-b',
            scope: 'hcp:general_preferences:read',
            verifier: createCodeVerifier(),
        });
        const requestB = decodeJwt(ticketFrom(location)).request_id as string;
        // B's pending request, A's grant, the right subject, a valid signature.
        const crossed = await signConsentAssertion(config, {
            requestId: requestB,
            grantId: a.approval.grantId,
            subjectDid: SUBJECT_DID,
        });
        const res = await complete(crossed);
        expect(res.status).toBe(400);
        expect((await res.json()) as { error: string; error_description: string }).toEqual({
            error: 'access_denied',
            error_description: 'grant was not issued to this client',
        });
    });

    it('re-consent with the same client and scopes reuses the grant; other scopes get a new one', async () => {
        const redirectUri = 'http://127.0.0.1/cb-reconsent';
        const clientId = await register(redirectUri);
        const approve = async (scope: string) => {
            const { location } = await authorize({
                clientId,
                redirectUri,
                scope,
                verifier: createCodeVerifier(),
            });
            return approveOAuthRequest(
                harness.deps,
                subject,
                { ticket: ticketFrom(location) },
                config
            );
        };
        const expiresInMs = async (grantId: string) =>
            new Date((await harness.store.getGrant(grantId))!.expiresAt!).getTime() -
            harness.deps.now().getTime();

        const first = await approve('hcp:health_context:read');
        expect(await expiresInMs(first.grantId)).toBe(OAUTH_GRANT_DURATION_MS);

        // 55 minutes later the person signs in again: they get a full hour, not 5 minutes.
        harness.advance(55 * 60 * 1000);
        expect(await expiresInMs(first.grantId)).toBe(5 * 60 * 1000);
        const second = await approve('hcp:health_context:read');
        expect(second.grantId).not.toBe(first.grantId);
        expect(await expiresInMs(second.grantId)).toBe(OAUTH_GRANT_DURATION_MS);

        // The old grant is revoked as superseded (audited), so its tokens stop.
        expect((await harness.store.getGrant(first.grantId))!.status).toBe('revoked');
        const audit = await listAudit(harness.deps, subject, { grantId: first.grantId, limit: 50 });
        expect(audit.events.map(e => [e.eventType, e.data])).toContainEqual([
            'grant.revoked',
            { reason: 'superseded', supersededBy: second.grantId },
        ]);
        const active = (await harness.store.listGrants(SUBJECT_DID, 'active')).filter(
            g => g.client.id === deriveOAuthClientDid(baseUrl, clientId)
        );
        expect(active.map(g => g.grantId)).toEqual([second.grantId]);

        const wider = await approve('hcp:health_context:read hcp:general_preferences:read');
        expect(wider.grantId).not.toBe(second.grantId);
        // A grant with different scopes is left alone, not revoked.
        expect((await harness.store.getGrant(second.grantId))!.status).toBe('active');
    });

    it("re-consent cuts off the old grant's token, and revoking the new grant cuts off its own", async () => {
        const redirectUri = 'http://127.0.0.1/cb-relogin-token';
        const clientId = await register(redirectUri);
        const login = async () => {
            const verifier = createCodeVerifier();
            const { location } = await authorize({
                clientId,
                redirectUri,
                scope: 'hcp:general_preferences:read',
                verifier,
            });
            const approval = await approveOAuthRequest(
                harness.deps,
                subject,
                { ticket: ticketFrom(location) },
                config
            );
            const done = await complete(
                new URL(approval.completeUrl).searchParams.get('assertion')
            );
            const token = await exchange({
                location: done.headers.get('location')!,
                clientId,
                redirectUri,
                verifier,
            });
            return { approval, token: token.access_token };
        };
        const resolve = (token: string) => resolveBearerToGrant(harness.deps, tokenConfig, token);

        const old = await login();
        expect((await resolve(old.token)).ok).toBe(true);
        const fresh = await login();
        expect(await resolve(old.token)).toEqual({
            ok: false,
            status: 401,
            error: 'revoked_grant',
        });
        expect((await resolve(fresh.token)).ok).toBe(true);

        await revokeGrant(harness.deps, subject, fresh.approval.grantId);
        expect(await resolve(fresh.token)).toEqual({
            ok: false,
            status: 401,
            error: 'revoked_grant',
        });
    });
});

describe('HCP OAuth dev typed consent form', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    const base = () => {
        const harness = makeHarness();
        return {
            store: harness.store,
            hcp: harness.deps,
            issuerUrl: 'http://127.0.0.1:1',
            tokenSecret: SECRET,
            consentAppUrl: APP_URL,
        };
    };

    it('is not served unless devTypedConsent is set (404)', async () => {
        const port = await freePort();
        const server = createServer(createHcpOAuthApp(base()));
        await new Promise<void>(resolve => server.listen(port, '127.0.0.1', resolve));
        try {
            const url = `http://127.0.0.1:${port}/oauth/consent`;
            expect((await fetch(`${url}?request_id=x`)).status).toBe(404);
            const post = await fetch(url, {
                method: 'POST',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                body: formBody({ request_id: 'x', subject_did: SUBJECT_DID, grant_id: 'g' }),
            });
            expect(post.status).toBe(404);
        } finally {
            await close(server);
        }
    });

    it('refuses to construct with devTypedConsent when NODE_ENV is production', () => {
        vi.stubEnv('NODE_ENV', 'production');
        expect(() => createHcpOAuthApp({ ...base(), devTypedConsent: true })).toThrow(
            /devTypedConsent is not allowed/
        );
        expect(() => createHcpOAuthApp(base())).not.toThrow();
    });
});
