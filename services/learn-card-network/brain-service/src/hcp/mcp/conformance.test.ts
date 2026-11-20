/**
 * Unit 3 Draft 3 MCP binding conformance suite.
 *
 * Each test cites the Draft 3 section it exercises (pin b7905618). Assertions are
 * on observable HTTP / MCP / discovery behavior - not internal helpers.
 *
 * Official Part URIs (`conformsTo` / `bindings`) stay unclaimed: see CONFORMANCE.md.
 */
import { createServer, type Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createGrant } from '../v1/service/grants';
import { createEntry } from '../v1/service/entries';
import { hcpV1Meta } from '../v1/service/meta';
import {
    PURPOSE,
    SUBJECT_DID,
    entryInput,
    grantInput,
    makeHarness,
    subject,
} from '../v1/service/test-harness';
import { createCodeChallenge, createCodeVerifier } from '../oauth/pkce';
import { createHcpMcpApp, HCP_MCP_PATH } from './app';
import { HCP_MCP_EXTENSION_ID } from './discovery';
import { HCP_MCP_TOOL_NAMES } from './tools';
import type { TokenSignerConfig } from '../oauth/tokens';

const TOKEN_SECRET = 'unit-test-hcp-mcp-conformance-secret!!';
const formBody = (fields: Record<string, string>) => new URLSearchParams(fields).toString();

const listenWithMatchingIssuer = async (
    harness: ReturnType<typeof makeHarness>
): Promise<{ server: Server; baseUrl: string; tokenConfig: TokenSignerConfig }> => {
    const probe = createServer();
    await new Promise<void>(resolve => probe.listen(0, '127.0.0.1', resolve));
    const address = probe.address();
    if (!address || typeof address === 'string') throw new Error('expected TCP port');
    const port = address.port;
    await new Promise<void>((resolve, reject) =>
        probe.close(error => (error ? reject(error) : resolve()))
    );
    const baseUrl = `http://127.0.0.1:${port}`;
    const app = createHcpMcpApp({
        store: harness.store,
        hcp: harness.deps,
        issuerUrl: baseUrl,
        resourceUrl: baseUrl,
        tokenSecret: TOKEN_SECRET,
        now: harness.deps.now,
        consentAppUrl: 'http://app.test',
        // Pre-issued grants via the dev typed form; consent.test.ts covers the app path.
        devTypedConsent: true,
    });
    const server = createServer(app);
    await new Promise<void>((resolve, reject) => {
        server.listen(port, '127.0.0.1', resolve);
        server.on('error', reject);
    });
    return {
        server,
        baseUrl,
        tokenConfig: { secret: TOKEN_SECRET, issuerUrl: baseUrl, resourceUrl: baseUrl },
    };
};

const runCodeFlow = async (opts: {
    baseUrl: string;
    redirectUri: string;
    grantId: string;
    subjectDid: string;
    scope?: string;
}) => {
    const reg = await fetch(`${opts.baseUrl}/oauth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            client_name: 'mcp-conformance',
            redirect_uris: [opts.redirectUri],
            grant_types: ['authorization_code'],
            response_types: ['code'],
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
    authorizeUrl.searchParams.set('state', 'conform');
    authorizeUrl.searchParams.set('resource', opts.baseUrl);
    if (opts.scope) authorizeUrl.searchParams.set('scope', opts.scope);

    const authRes = await fetch(authorizeUrl, { redirect: 'manual' });
    expect([302, 303]).toContain(authRes.status);
    const consentLocation = authRes.headers.get('location');
    expect(consentLocation).toBeTruthy();
    const consentUrl = new URL(consentLocation!, opts.baseUrl);
    const requestId = consentUrl.searchParams.get('request_id');
    expect(requestId).toBeTruthy();

    const consentRes = await fetch(`${opts.baseUrl}/oauth/consent`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: formBody({
            request_id: requestId!,
            subject_did: opts.subjectDid,
            grant_id: opts.grantId,
        }),
        redirect: 'manual',
    });
    expect([302, 303]).toContain(consentRes.status);
    const redirectTo = consentRes.headers.get('location');
    expect(redirectTo).toBeTruthy();
    const code = new URL(redirectTo!).searchParams.get('code');
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
    const tokenBody = (await tokenRes.json()) as { access_token: string; scope: string };
    return { client, tokenBody };
};

const mcpCall = async (
    baseUrl: string,
    token: string | null,
    body: Record<string, unknown>
): Promise<Response> =>
    fetch(`${baseUrl}${HCP_MCP_PATH}`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            accept: 'application/json, text/event-stream',
            ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
    });

describe('HCP MCP Unit 3 conformance (Draft 3 §10 / §13.5 / §18–19)', () => {
    const harness = makeHarness();
    let baseUrl = '';
    let server: Server;
    let grantId = '';
    let accessToken = '';

    beforeAll(async () => {
        const grant = await createGrant(
            harness.deps,
            subject,
            grantInput({ actions: ['read', 'write'] })
        );
        grantId = grant.grantId;
        await createEntry(harness.deps, subject, entryInput({ value: 'Conformance fixture' }));
        const listening = await listenWithMatchingIssuer(harness);
        server = listening.server;
        baseUrl = listening.baseUrl;
        const { tokenBody } = await runCodeFlow({
            baseUrl,
            redirectUri: 'http://127.0.0.1/cb-conform',
            grantId,
            subjectDid: SUBJECT_DID,
        });
        accessToken = tokenBody.access_token;
    });

    afterAll(async () => {
        await new Promise<void>((resolve, reject) =>
            server.close(error => (error ? reject(error) : resolve()))
        );
    });

    // §10.3 - tools/list names the six context-plane tools
    it('§10.3 tools/list returns exactly the six hcp_* tool names', async () => {
        const res = await mcpCall(baseUrl, accessToken, {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list',
            params: {},
        });
        expect(res.status).toBe(200);
        const body = (await res.json()) as { result?: { tools?: { name: string }[] } };
        const names = (body.result?.tools ?? []).map(t => t.name).sort();
        expect(names).toEqual([...HCP_MCP_TOOL_NAMES].sort());
    });

    // §10.1 / MCP Streamable HTTP auth - every request carries authorization
    it('§10.1 rejects unauthenticated tools/list with 401', async () => {
        const res = await mcpCall(baseUrl, null, {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/list',
            params: {},
        });
        expect(res.status).toBe(401);
    });

    // §10.3 last bullet - grant presented with the call authorizes the op
    it('§10.3 grant-bound token succeeds for in-scope hcp_queryContext', async () => {
        const res = await mcpCall(baseUrl, accessToken, {
            jsonrpc: '2.0',
            id: 3,
            method: 'tools/call',
            params: {
                name: 'hcp_queryContext',
                arguments: { query: 'preferences', purpose: PURPOSE },
            },
        });
        expect(res.status).toBe(200);
        const body = (await res.json()) as {
            result?: { isError?: boolean; structuredContent?: { entries?: unknown[] } };
        };
        expect(body.result?.isError).toBeFalsy();
        expect((body.result?.structuredContent?.entries ?? []).length).toBeGreaterThan(0);
        expect(JSON.stringify(body)).not.toContain('grantId');
    });

    // §10.3 + Unit 1 scope intersection - out-of-scope write fails
    it('§10.3 out-of-scope write fails when token scopes omit write', async () => {
        const { tokenBody } = await runCodeFlow({
            baseUrl,
            redirectUri: 'http://127.0.0.1/cb-conform-ro',
            grantId,
            subjectDid: SUBJECT_DID,
            scope: 'hcp:general_preferences:read',
        });
        const res = await mcpCall(baseUrl, tokenBody.access_token, {
            jsonrpc: '2.0',
            id: 4,
            method: 'tools/call',
            params: {
                name: 'hcp_createEntry',
                arguments: {
                    categories: ['general_preferences'],
                    content: 'Should be denied',
                    declarationType: 'person-declared',
                    sourceContext: 'conformance',
                },
            },
        });
        expect(res.status).toBe(200);
        const body = (await res.json()) as {
            result?: { isError?: boolean; structuredContent?: { type?: string } };
        };
        expect(body.result?.isError).toBe(true);
        expect(body.result?.structuredContent?.type).toBe('scope-denied');
    });

    // §13.5 / RFC 9728 + RFC 8414 - PRM and AS metadata present
    it('§13.5 PRM and AS metadata endpoints are present', async () => {
        const prm = await fetch(`${baseUrl}/.well-known/oauth-protected-resource`);
        expect(prm.status).toBe(200);
        const prmBody = (await prm.json()) as {
            resource?: string;
            authorization_servers?: string[];
            bearer_methods_supported?: string[];
        };
        expect(prmBody.resource).toBe(baseUrl);
        expect(prmBody.authorization_servers).toContain(baseUrl);
        expect(prmBody.bearer_methods_supported).toContain('header');

        const as = await fetch(`${baseUrl}/.well-known/oauth-authorization-server`);
        expect(as.status).toBe(200);
        const asBody = (await as.json()) as {
            issuer?: string;
            authorization_endpoint?: string;
            token_endpoint?: string;
            code_challenge_methods_supported?: string[];
        };
        expect(asBody.issuer).toBe(baseUrl);
        expect(asBody.authorization_endpoint).toContain('/oauth/authorize');
        expect(asBody.token_endpoint).toContain('/oauth/token');
        expect(asBody.code_challenge_methods_supported).toContain('S256');
    });

    // §10.3.6 / Q3 - reportSharing registered; structured not-implemented
    it('§10.3.6 hcp_reportSharing returns structured not-implemented', async () => {
        const res = await mcpCall(baseUrl, accessToken, {
            jsonrpc: '2.0',
            id: 5,
            method: 'tools/call',
            params: {
                name: 'hcp_reportSharing',
                arguments: {
                    recipient: { domain: 'school.example', name: 'School' },
                    refs: ['urn:uuid:fake'],
                    purpose: PURPOSE,
                    sharedAt: '2026-11-19T20:00:00.000Z',
                },
            },
        });
        expect(res.status).toBe(200);
        const body = (await res.json()) as {
            result?: { isError?: boolean; structuredContent?: { type?: string } };
        };
        expect(body.result?.isError).toBe(true);
        expect(body.result?.structuredContent?.type).toBe('not-implemented');
    });

    // §10.2 - initialize advertises example.hcp/hcp (MCP initialize carries discover payload)
    it('§10.2 initialize advertises example.hcp/hcp extension with discovery URL', async () => {
        const res = await mcpCall(baseUrl, accessToken, {
            jsonrpc: '2.0',
            id: 6,
            method: 'initialize',
            params: {
                protocolVersion: '2025-03-26',
                capabilities: {},
                clientInfo: { name: 'hcp-conformance', version: '0.0.1' },
            },
        });
        expect(res.status).toBe(200);
        const body = (await res.json()) as {
            result?: {
                capabilities?: {
                    extensions?: Record<string, { discovery?: string; conformsTo?: string[] }>;
                };
            };
        };
        const ext = body.result?.capabilities?.extensions?.[HCP_MCP_EXTENSION_ID];
        expect(ext).toBeTruthy();
        expect(ext?.discovery).toBe(`${baseUrl}/.well-known/hcp-configuration`);
        // Honesty: no official Part URIs until §18.1 can be satisfied.
        expect(ext?.conformsTo).toEqual([]);
    });

    // §19 - discovery document present; official claims empty
    it('§19 /.well-known/hcp-configuration is present without official Part claims', async () => {
        const res = await fetch(`${baseUrl}/.well-known/hcp-configuration`);
        expect(res.status).toBe(200);
        const body = (await res.json()) as {
            mcp_endpoint?: string;
            protected_resource_metadata?: string;
            conformsTo?: string[];
            bindings?: string[];
            learncard_status?: { official_conformsTo_claimed?: boolean; mcp_tools?: string[] };
        };
        expect(body.mcp_endpoint).toBe(`${baseUrl}${HCP_MCP_PATH}`);
        expect(body.protected_resource_metadata).toContain('oauth-protected-resource');
        expect(body.conformsTo).toEqual([]);
        expect(body.bindings).toEqual([]);
        expect(body.learncard_status?.official_conformsTo_claimed).toBe(false);
        expect(body.learncard_status?.mcp_tools?.sort()).toEqual([...HCP_MCP_TOOL_NAMES].sort());
    });

    // §18.1 - tRPC meta still does not claim official Part URIs
    it('§18.1 tRPC hcp.v1.meta does not claim official conformsTo/bindings', () => {
        const meta = hcpV1Meta() as Record<string, unknown>;
        expect(meta).not.toHaveProperty('conformsTo');
        expect(meta).not.toHaveProperty('bindings');
        // Guard against accidental URI claims elsewhere in the object.
        expect(JSON.stringify(meta)).not.toContain('https://hcp.example/spec/bindings/mcp/2.0');
        expect(JSON.stringify(meta)).not.toContain('https://hcp.example/spec/core/2.0');
    });
});
