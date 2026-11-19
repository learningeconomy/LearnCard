import { createServer, type Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

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

const formBody = (fields: Record<string, string>) => new URLSearchParams(fields).toString();

const startApp = async (port: number, baseUrl: string, harness: ReturnType<typeof makeHarness>) => {
    const app = createHcpOAuthApp({
        store: harness.store,
        hcp: harness.deps,
        issuerUrl: baseUrl,
        resourceUrl: baseUrl,
        tokenSecret: 'unit-test-hcp-oauth-secret-32bytes!!',
        now: harness.deps.now,
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
    harness: ReturnType<typeof makeHarness>
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
    const server = await startApp(port, baseUrl, harness);
    return { server, baseUrl };
};

const runCodeFlow = async (opts: {
    baseUrl: string;
    redirectUri: string;
    grantId: string;
    subjectDid: string;
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

    const authRes = await fetch(authorizeUrl, { redirect: 'manual' });
    expect(authRes.status).toBe(302);
    const consentLocation = authRes.headers.get('location');
    expect(consentLocation).toMatch(/\/oauth\/consent\?request_id=/);
    const requestId = new URL(consentLocation!, opts.baseUrl).searchParams.get('request_id');
    expect(requestId).toBeTruthy();

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
    let baseUrl = '';
    let server: Server;
    let grantId = '';

    beforeAll(async () => {
        const grant = await createGrant(harness.deps, subject, grantInput());
        grantId = grant.grantId;
        const listening = await listenWithMatchingIssuer(harness);
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
});
