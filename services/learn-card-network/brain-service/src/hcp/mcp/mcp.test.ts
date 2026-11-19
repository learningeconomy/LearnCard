import { createServer, type Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';

import { createGrant, revokeGrant } from '../v1/service/grants';
import { createEntry } from '../v1/service/entries';
import {
    CLIENT_DID,
    PURPOSE,
    SUBJECT_DID,
    entryInput,
    grantInput,
    makeHarness,
    subject,
} from '../v1/service/test-harness';
import { createCodeChallenge, createCodeVerifier } from '../oauth/pkce';
import { createHcpMcpApp, HCP_MCP_PATH } from './app';
import { authInfoFromResolved, narrowAccessToScopes } from './auth-bridge';
import { HCP_MCP_TOOL_NAMES, createHcpMcpTools } from './tools';
import { CONTEXT_ACCESS_DETAIL_TYPE, type AccessDetail } from '../v1/schemas';
import { resolveBearerToGrant } from '../oauth/rs';
import type { TokenSignerConfig } from '../oauth/tokens';

const TOKEN_SECRET = 'unit-test-hcp-mcp-secret-32bytes!!!!';
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
            client_name: 'mcp-test',
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
    authorizeUrl.searchParams.set('resource', opts.baseUrl);
    authorizeUrl.searchParams.set('state', 'mcp');
    if (opts.scope) authorizeUrl.searchParams.set('scope', opts.scope);

    const authRes = await fetch(authorizeUrl, { redirect: 'manual' });
    expect(authRes.status).toBe(302);
    const consentLocation = authRes.headers.get('location');
    const requestId = new URL(consentLocation!, opts.baseUrl).searchParams.get('request_id');

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
    expect(consentRes.status).toBe(302);
    const code = new URL(consentRes.headers.get('location')!).searchParams.get('code');

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

describe('narrowAccessToScopes', () => {
    const access: AccessDetail[] = [
        {
            type: CONTEXT_ACCESS_DETAIL_TYPE,
            actions: ['read', 'write'],
            categories: ['general_preferences'],
            purposes: [{ code: PURPOSE, description: 'Help' }],
        },
    ];

    it('drops write when the token only has read', () => {
        const narrowed = narrowAccessToScopes(access, ['hcp:general_preferences:read']);
        expect(narrowed).toHaveLength(1);
        expect(narrowed[0]!.actions).toEqual(['read']);
    });
});

describe('HCP MCP Unit 2 tools (handlers)', () => {
    const harness = makeHarness();
    let grantId = '';
    let authInfo: AuthInfo;

    beforeAll(async () => {
        const grant = await createGrant(
            harness.deps,
            subject,
            grantInput({ actions: ['read', 'write'] })
        );
        grantId = grant.grantId;
        // Seed a subject-owned active entry the client can read.
        await createEntry(harness.deps, subject, entryInput({ value: 'Prefers short answers' }));

        authInfo = {
            token: 'handler-test',
            clientId: 'test-client',
            scopes: ['hcp:general_preferences:read', 'hcp:general_preferences:write'],
            extra: { did: CLIENT_DID, grantId, subjectDid: SUBJECT_DID },
        };
    });

    it('registers all six §10.3 tool names', () => {
        const tools = createHcpMcpTools({ hcp: harness.deps });
        expect(tools.map(t => t.name).sort()).toEqual([...HCP_MCP_TOOL_NAMES].sort());
    });

    it('hcp_queryContext happy path returns disclosures (no grantId in args)', async () => {
        const tools = createHcpMcpTools({ hcp: harness.deps });
        const query = tools.find(t => t.name === 'hcp_queryContext')!;
        const result = await query.handler(
            { query: 'preferences', purpose: PURPOSE },
            { authInfo }
        );
        expect(result.isError).toBeFalsy();
        const body = result.structuredContent as {
            entries: { ref?: string; content?: { value?: string } }[];
        };
        expect(body.entries.length).toBeGreaterThan(0);
        expect(body.entries[0]?.ref).toBeTruthy();
        expect(JSON.stringify(result)).not.toContain('grantId');
    });

    it('hcp_createEntry uses LC WritePolicy (suggested without canWrite)', async () => {
        const tools = createHcpMcpTools({ hcp: harness.deps });
        const create = tools.find(t => t.name === 'hcp_createEntry')!;
        const result = await create.handler(
            {
                categories: ['general_preferences'],
                content: 'Likes dark mode',
                declarationType: 'person-declared',
                sourceContext: 'mcp-test',
            },
            { authInfo }
        );
        expect(result.isError).toBeFalsy();
        const body = result.structuredContent as { suggested?: boolean; ref?: string };
        // Default grantWritePolicy: client without canWrite → suggested (LC extension).
        expect(body.suggested).toBe(true);
        expect(body.ref).toBeTruthy();
    });

    it('hcp_reportSharing returns not-implemented Core error shape', async () => {
        const tools = createHcpMcpTools({ hcp: harness.deps });
        const report = tools.find(t => t.name === 'hcp_reportSharing')!;
        const result = await report.handler(
            {
                recipient: { domain: 'school.example', name: 'School' },
                refs: ['urn:uuid:fake'],
                purpose: PURPOSE,
                sharedAt: '2026-11-19T20:00:00.000Z',
            },
            { authInfo }
        );
        expect(result.isError).toBe(true);
        expect(result.structuredContent).toMatchObject({ type: 'not-implemented' });
    });

    it('scope-denied when token scopes omit write (P1 intersection honored)', async () => {
        const tools = createHcpMcpTools({ hcp: harness.deps });
        const create = tools.find(t => t.name === 'hcp_createEntry')!;
        const readOnlyAuth: AuthInfo = {
            ...authInfo,
            scopes: ['hcp:general_preferences:read'],
        };
        const result = await create.handler(
            {
                categories: ['general_preferences'],
                content: 'Should fail',
                declarationType: 'person-declared',
                sourceContext: 'mcp-test',
            },
            { authInfo: readOnlyAuth }
        );
        expect(result.isError).toBe(true);
        expect(result.structuredContent).toMatchObject({ type: 'scope-denied' });
    });
});

describe('HCP MCP Unit 2 HTTP (bearer)', () => {
    const harness = makeHarness();
    let baseUrl = '';
    let server: Server;
    let tokenConfig: TokenSignerConfig;
    let grantId = '';

    beforeAll(async () => {
        const grant = await createGrant(
            harness.deps,
            subject,
            grantInput({ actions: ['read', 'write'] })
        );
        grantId = grant.grantId;
        await createEntry(harness.deps, subject, entryInput({ value: 'HTTP fixture entry' }));
        const listening = await listenWithMatchingIssuer(harness);
        server = listening.server;
        baseUrl = listening.baseUrl;
        tokenConfig = listening.tokenConfig;
    });

    afterAll(async () => {
        await new Promise<void>((resolve, reject) =>
            server.close(error => (error ? reject(error) : resolve()))
        );
    });

    it('rejects missing bearer with 401', async () => {
        const res = await mcpCall(baseUrl, null, {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list',
            params: {},
        });
        expect(res.status).toBe(401);
    });

    it('lists the six tools when authorized', async () => {
        const { tokenBody } = await runCodeFlow({
            baseUrl,
            redirectUri: 'http://127.0.0.1/cb-mcp-list',
            grantId,
            subjectDid: SUBJECT_DID,
        });
        const res = await mcpCall(baseUrl, tokenBody.access_token, {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/list',
            params: {},
        });
        expect(res.status).toBe(200);
        const body = (await res.json()) as {
            result?: { tools?: { name: string }[] };
        };
        const names = (body.result?.tools ?? []).map(t => t.name).sort();
        expect(names).toEqual([...HCP_MCP_TOOL_NAMES].sort());
    });

    it('tools/call hcp_queryContext over Streamable HTTP', async () => {
        const { tokenBody } = await runCodeFlow({
            baseUrl,
            redirectUri: 'http://127.0.0.1/cb-mcp-query',
            grantId,
            subjectDid: SUBJECT_DID,
        });
        const res = await mcpCall(baseUrl, tokenBody.access_token, {
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
    });

    it('rejects a token after the bound grant is revoked', async () => {
        const other = await createGrant(
            harness.deps,
            subject,
            grantInput({ clientDid: 'did:key:z6MkMcpRevokeClient', actions: ['read', 'write'] })
        );
        const { tokenBody } = await runCodeFlow({
            baseUrl,
            redirectUri: 'http://127.0.0.1/cb-mcp-revoke',
            grantId: other.grantId,
            subjectDid: SUBJECT_DID,
        });
        await revokeGrant(harness.deps, subject, other.grantId);

        const res = await mcpCall(baseUrl, tokenBody.access_token, {
            jsonrpc: '2.0',
            id: 4,
            method: 'tools/list',
            params: {},
        });
        expect(res.status).toBe(401);

        const resolved = await resolveBearerToGrant(
            harness.deps,
            tokenConfig,
            tokenBody.access_token
        );
        expect(resolved.ok).toBe(false);
        if (!resolved.ok) expect(resolved.error).toBe('revoked_grant');
    });

    it('authInfoFromResolved carries expiresAt for MCP requireBearerAuth', () => {
        const info = authInfoFromResolved('t', {
            grant: { grantId: 'urn:uuid:g' } as never,
            clientDid: CLIENT_DID,
            oauthClientId: 'c',
            scopes: ['hcp:general_preferences:read'],
            tokenJti: 'j',
            expiresAt: 1_800_000_000,
        });
        expect(info.extra?.grantId).toBe('urn:uuid:g');
        expect(info.expiresAt).toBe(1_800_000_000);
        expect(info.scopes).toEqual(['hcp:general_preferences:read']);
    });
});
