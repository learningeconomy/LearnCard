import { createServer, type Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { AccessDetail } from '../v1/schemas';
import type { HcpV1Store } from '../v1/store/port';
import { createGrant, revokeGrant } from '../v1/service/grants';
import {
    CLIENT_DID,
    SUBJECT_DID,
    grantInput,
    makeHarness,
    subject,
} from '../v1/service/test-harness';
import { createHcpOAuthApp } from './app';
import { createCodeChallenge, createCodeVerifier } from './pkce';
import { createMemoryOAuthSessionStore, type HcpOAuthSessionStore } from './session-store';
import type { PendingAuthorization } from './types';

const formBody = (fields: Record<string, string>) => new URLSearchParams(fields).toString();

/** Lets a test shrink live grant.access after a token is minted (Critic P1-b). */
const withAccessOverrides = (
    inner: HcpV1Store,
    overrides: Map<string, AccessDetail[]>
): HcpV1Store =>
    new Proxy(inner, {
        get(target, prop, receiver) {
            if (prop === 'getGrant') {
                return async (grantId: string) => {
                    const grant = await target.getGrant(grantId);
                    if (!grant) return null;
                    const access = overrides.get(grantId);
                    return access ? { ...grant, access } : grant;
                };
            }
            const value = Reflect.get(target, prop, receiver);
            return typeof value === 'function' ? value.bind(target) : value;
        },
    });

const startApp = async (
    port: number,
    baseUrl: string,
    harness: ReturnType<typeof makeHarness>,
    store: HcpV1Store,
    sessions?: HcpOAuthSessionStore
) => {
    const app = createHcpOAuthApp({
        store,
        hcp: { ...harness.deps, store },
        issuerUrl: baseUrl,
        resourceUrl: baseUrl,
        tokenSecret: 'unit-test-hcp-oauth-secret-32bytes!!',
        now: harness.deps.now,
        sessions,
    });
    const server = createServer(app);
    await new Promise<void>((resolve, reject) => {
        server.listen(port, '127.0.0.1', resolve);
        server.on('error', reject);
    });
    return server;
};

/** Reserve an ephemeral port, then re-bind the real app with issuer === that URL. */
const listenWithMatchingIssuer = async (
    harness: ReturnType<typeof makeHarness>,
    store: HcpV1Store,
    sessions?: HcpOAuthSessionStore
): Promise<{ server: Server; baseUrl: string }> => {
    const probe = createServer();
    await new Promise<void>(resolve => probe.listen(0, '127.0.0.1', resolve));
    const address = probe.address();
    if (!address || typeof address === 'string') throw new Error('expected TCP port');
    const port = address.port;
    await new Promise<void>((resolve, reject) =>
        probe.close(error => (error ? reject(error) : resolve()))
    );
    const baseUrl = `http://127.0.0.1:${port}`;
    const server = await startApp(port, baseUrl, harness, store, sessions);
    return { server, baseUrl };
};

const runCodeFlow = async (opts: {
    baseUrl: string;
    redirectUri: string;
    grantId: string;
    subjectDid: string;
    /** Optional authorize `scope` (space-separated). Narrower than the grant exercises P1. */
    scope?: string;
}) => {
    const reg = await fetch(`${opts.baseUrl}/oauth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            redirect_uris: [opts.redirectUri],
            client_name: 'Claude Code test',
            token_endpoint_auth_method: 'none',
        }),
    });
    expect(reg.status).toBe(201);
    const client = (await reg.json()) as { client_id: string };

    const verifier = createCodeVerifier();
    const authorizeUrl = new URL(`${opts.baseUrl}/oauth/authorize`);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('client_id', client.client_id);
    authorizeUrl.searchParams.set('redirect_uri', opts.redirectUri);
    authorizeUrl.searchParams.set('code_challenge', createCodeChallenge(verifier));
    authorizeUrl.searchParams.set('code_challenge_method', 'S256');
    authorizeUrl.searchParams.set('resource', opts.baseUrl);
    authorizeUrl.searchParams.set('state', 'xyz');
    if (opts.scope) authorizeUrl.searchParams.set('scope', opts.scope);

    const authRes = await fetch(authorizeUrl, { redirect: 'manual' });
    expect(authRes.status).toBe(302);
    const consentLocation = authRes.headers.get('location');
    expect(consentLocation).toMatch(/\/oauth\/consent\?request_id=/);
    const requestId = new URL(consentLocation!, opts.baseUrl).searchParams.get('request_id');
    expect(requestId).toBeTruthy();

    const consentPage = await fetch(
        `${opts.baseUrl}/oauth/consent?request_id=${encodeURIComponent(requestId!)}`
    );
    expect(consentPage.status).toBe(200);

    const consentRes = await fetch(`${opts.baseUrl}/oauth/consent`, {
        method: 'POST',
        redirect: 'manual',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: formBody({
            request_id: requestId!,
            subject_did: opts.subjectDid,
            grant_id: opts.grantId,
        }),
    });
    if (consentRes.status !== 302) {
        const errBody = await consentRes.text();
        throw new Error(`consent expected 302, got ${consentRes.status}: ${errBody}`);
    }
    const cb = new URL(consentRes.headers.get('location')!);
    expect(cb.searchParams.get('state')).toBe('xyz');
    const code = cb.searchParams.get('code');
    expect(code).toBeTruthy();

    const tokenRes = await fetch(`${opts.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: formBody({
            grant_type: 'authorization_code',
            code: code!,
            redirect_uri: opts.redirectUri,
            client_id: client.client_id,
            code_verifier: verifier,
            resource: opts.baseUrl,
        }),
    });
    expect(tokenRes.status).toBe(200);
    const tokenBody = (await tokenRes.json()) as {
        access_token: string;
        token_type: string;
        scope: string;
    };
    return { client, tokenBody };
};

describe('HCP OAuth Unit 1 (AS + PRM + RS probe)', () => {
    const harness = makeHarness();
    const accessOverrides = new Map<string, AccessDetail[]>();
    const store = withAccessOverrides(harness.store, accessOverrides);
    let baseUrl = '';
    let server: Server;
    let grantId = '';

    beforeAll(async () => {
        const grant = await createGrant(harness.deps, subject, grantInput());
        grantId = grant.grantId;
        const listening = await listenWithMatchingIssuer(harness, store);
        server = listening.server;
        baseUrl = listening.baseUrl;
    });

    afterAll(async () => {
        await new Promise<void>((resolve, reject) =>
            server.close(error => (error ? reject(error) : resolve()))
        );
    });

    it('serves PRM naming the AS and scopes (§13.5 / RFC 9728)', async () => {
        const res = await fetch(`${baseUrl}/.well-known/oauth-protected-resource`);
        expect(res.status).toBe(200);
        const body = (await res.json()) as {
            resource: string;
            authorization_servers: string[];
            scopes_supported: string[];
        };
        expect(body.resource).toBe(baseUrl);
        expect(body.authorization_servers).toEqual([baseUrl]);
        expect(body.scopes_supported).toContain('hcp:general_preferences:read');
    });

    it('serves AS metadata with authorize, token, register, S256', async () => {
        const res = await fetch(`${baseUrl}/.well-known/oauth-authorization-server`);
        expect(res.status).toBe(200);
        const body = (await res.json()) as Record<string, unknown>;
        expect(body.issuer).toBe(baseUrl);
        expect(body.authorization_endpoint).toBe(`${baseUrl}/oauth/authorize`);
        expect(body.token_endpoint).toBe(`${baseUrl}/oauth/token`);
        expect(body.registration_endpoint).toBe(`${baseUrl}/oauth/register`);
        expect(body.code_challenge_methods_supported).toEqual(['S256']);
    });

    it('issues a grant-bound token via PKCE and resolves probe without grantId in body', async () => {
        const { client, tokenBody } = await runCodeFlow({
            baseUrl,
            redirectUri: 'http://127.0.0.1/cb',
            grantId,
            subjectDid: SUBJECT_DID,
        });
        expect(tokenBody.token_type).toBe('Bearer');
        expect(tokenBody.scope.split(' ')).toContain('hcp:general_preferences:read');

        const missing = await fetch(`${baseUrl}/hcp/oauth/v1/probe`);
        expect(missing.status).toBe(401);

        const bad = await fetch(`${baseUrl}/hcp/oauth/v1/probe`, {
            headers: { authorization: 'Bearer not-a-token' },
        });
        expect(bad.status).toBe(401);

        const probe = await fetch(`${baseUrl}/hcp/oauth/v1/probe`, {
            headers: { authorization: `Bearer ${tokenBody.access_token}` },
        });
        expect(probe.status).toBe(200);
        const probeBody = (await probe.json()) as {
            grantId: string;
            clientDid: string;
            oauthClientId: string;
            scopes: string[];
            status: string;
        };
        expect(probeBody.grantId).toBe(grantId);
        expect(probeBody.clientDid).toBe(CLIENT_DID);
        expect(probeBody.oauthClientId).toBe(client.client_id);
        expect(probeBody.status).toBe('active');
        expect(probeBody.scopes).toContain('hcp:general_preferences:read');
    });

    it('rejects a token after the bound grant is revoked', async () => {
        const other = await createGrant(
            harness.deps,
            subject,
            grantInput({ clientDid: 'did:key:z6MkRevokeProbeClient' })
        );
        const { tokenBody } = await runCodeFlow({
            baseUrl,
            redirectUri: 'http://127.0.0.1/cb-revoke',
            grantId: other.grantId,
            subjectDid: SUBJECT_DID,
        });

        await revokeGrant(harness.deps, subject, other.grantId);

        const probe = await fetch(`${baseUrl}/hcp/oauth/v1/probe`, {
            headers: { authorization: `Bearer ${tokenBody.access_token}` },
        });
        expect(probe.status).toBe(401);
    });

    it('probe scopes stay at the consented subset, not the wider live grant (P1-a)', async () => {
        const wide = await createGrant(
            harness.deps,
            subject,
            grantInput({
                clientDid: 'did:key:z6MkNarrowScopeClient',
                actions: ['read', 'write'],
            })
        );
        const { tokenBody } = await runCodeFlow({
            baseUrl,
            redirectUri: 'http://127.0.0.1/cb-narrow',
            grantId: wide.grantId,
            subjectDid: SUBJECT_DID,
            scope: 'hcp:general_preferences:read',
        });
        expect(tokenBody.scope.split(' ').sort()).toEqual(['hcp:general_preferences:read']);

        const probe = await fetch(`${baseUrl}/hcp/oauth/v1/probe`, {
            headers: { authorization: `Bearer ${tokenBody.access_token}` },
        });
        expect(probe.status).toBe(200);
        const probeBody = (await probe.json()) as { scopes: string[] };
        expect(probeBody.scopes).toEqual(['hcp:general_preferences:read']);
        expect(probeBody.scopes).not.toContain('hcp:general_preferences:write');
    });

    it('probe drops scopes removed from the live grant after mint (P1-b)', async () => {
        const wide = await createGrant(
            harness.deps,
            subject,
            grantInput({
                clientDid: 'did:key:z6MkShrinkAccessClient',
                actions: ['read', 'write'],
            })
        );
        const { tokenBody } = await runCodeFlow({
            baseUrl,
            redirectUri: 'http://127.0.0.1/cb-shrink',
            grantId: wide.grantId,
            subjectDid: SUBJECT_DID,
        });
        expect(tokenBody.scope.split(' ').sort()).toEqual([
            'hcp:general_preferences:read',
            'hcp:general_preferences:write',
        ]);

        const before = await fetch(`${baseUrl}/hcp/oauth/v1/probe`, {
            headers: { authorization: `Bearer ${tokenBody.access_token}` },
        });
        expect(before.status).toBe(200);
        expect(((await before.json()) as { scopes: string[] }).scopes.sort()).toEqual([
            'hcp:general_preferences:read',
            'hcp:general_preferences:write',
        ]);

        accessOverrides.set(wide.grantId, [
            {
                actions: ['read'],
                categories: ['general_preferences'],
                purposes: [{ code: 'https://purpose.example/assist', description: 'Help me' }],
            },
        ]);

        const after = await fetch(`${baseUrl}/hcp/oauth/v1/probe`, {
            headers: { authorization: `Bearer ${tokenBody.access_token}` },
        });
        expect(after.status).toBe(200);
        const afterBody = (await after.json()) as { scopes: string[] };
        expect(afterBody.scopes).toEqual(['hcp:general_preferences:read']);
        expect(afterBody.scopes).not.toContain('hcp:general_preferences:write');
    });

    it('GET /oauth/consent 400s for an unknown request_id (P3)', async () => {
        const res = await fetch(
            `${baseUrl}/oauth/consent?request_id=${encodeURIComponent('"><script>alert(1)</script>')}`
        );
        expect(res.status).toBe(400);
        const body = (await res.json()) as { error: string };
        expect(body.error).toBe('invalid_request');
        const text = JSON.stringify(body);
        expect(text).not.toContain('<script>');
    });
});

describe('HCP OAuth consent HTML escaping (P3)', () => {
    const harness = makeHarness();
    const sessions = createMemoryOAuthSessionStore();
    let baseUrl = '';
    let server: Server;

    beforeAll(async () => {
        const listening = await listenWithMatchingIssuer(harness, harness.store, sessions);
        server = listening.server;
        baseUrl = listening.baseUrl;
    });

    afterAll(async () => {
        await new Promise<void>((resolve, reject) =>
            server.close(error => (error ? reject(error) : resolve()))
        );
    });

    it('escapes request_id in the consent form attribute', async () => {
        const evilId = '"><img src=x onerror=alert(1)>';
        const pending: PendingAuthorization = {
            requestId: evilId,
            clientId: 'hcp_oauth_escape_test',
            redirectUri: 'http://127.0.0.1/cb-escape',
            state: null,
            codeChallenge: 'challenge',
            codeChallengeMethod: 'S256',
            scope: null,
            resource: baseUrl,
            createdAt: Date.now(),
        };
        await sessions.saveClient({
            client_id: pending.clientId,
            redirect_uris: [pending.redirectUri],
            grant_types: ['authorization_code'],
            response_types: ['code'],
            token_endpoint_auth_method: 'none',
            created_at: Math.floor(Date.now() / 1000),
        });
        await sessions.savePending(pending);

        const res = await fetch(
            `${baseUrl}/oauth/consent?request_id=${encodeURIComponent(evilId)}`
        );
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain('value="&quot;&gt;&lt;img src=x onerror=alert(1)&gt;"');
        expect(html).not.toContain(`value="${evilId}"`);
        expect(html).not.toMatch(/<img src=x onerror=/i);
    });
});
