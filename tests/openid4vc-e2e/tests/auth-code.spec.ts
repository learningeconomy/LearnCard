/**
 * Slice 4 e2e — OID4VCI authorization_code flow with PKCE.
 *
 * Drives the two-phase plugin API (`beginCredentialOfferAuthCode` →
 * follow /authorize redirect → `completeCredentialOfferAuthCode`)
 * against the in-process issuer. No browser — we follow the 302 with
 * `fetch({ redirect: 'manual' })` and extract the `code` param by hand,
 * which is also what a native deep-link handler would do when a
 * mobile browser fires a `learncard://cb` URI.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getOpenID4VCPlugin } from '@learncard/openid4vc-plugin';

import { startE2EServer, type E2EServerHandle } from '../server/server';
import { createAuthCodeOffer } from '../server/issuer';
import { buildMockLearnCard, type MockLearnCardHandle } from './helpers/mock-learncard';

let server: E2EServerHandle;

beforeAll(async () => {
    server = await startE2EServer();
});

afterAll(async () => {
    await server.stop();
});

const getPlugin = (mock: MockLearnCardHandle) => {
    const plugin = getOpenID4VCPlugin(mock.learnCard, {});
    const bound: Record<string, (...args: any[]) => any> = {};
    for (const [name, fn] of Object.entries(plugin.methods)) {
        bound[name] = (...args: any[]) =>
            (fn as (...a: any[]) => any)(mock.learnCard, ...args);
    }
    return bound as any;
};

/**
 * Stand-in for the wallet's native redirect handler. Hits the
 * authorization URL with `redirect: 'manual'`, reads the `Location`
 * header, extracts `code` + `state`.
 */
const followAuthorizeRedirect = async (
    authorizationUrl: string
): Promise<{ code: string; state: string }> => {
    const res = await fetch(authorizationUrl, { redirect: 'manual' });
    expect(res.status).toBe(302);

    const loc = res.headers.get('location');
    expect(loc).toBeTruthy();

    const parsed = new URL(loc!);
    const code = parsed.searchParams.get('code');
    const state = parsed.searchParams.get('state');
    expect(code).toBeTruthy();

    return { code: code!, state: state ?? '' };
};

describe('e2e: authorization_code flow with PKCE', () => {
    it('drives begin → /authorize → complete end-to-end', async () => {
        const mock = await buildMockLearnCard();
        const plugin = getPlugin(mock);

        // Wallet registers an ephemeral callback URI with the AS. For
        // this test the AS doesn't actually open it — we intercept the
        // 302 ourselves — so any string will do.
        const redirectUri = 'http://127.0.0.1:0/cb';
        const clientId = 'test-wallet';

        // Issuer creates an offer that carries the authorization_code
        // grant (no pre-auth code).
        const { offerUri } = createAuthCodeOffer(server.issuer, {
            configurationId: 'UniversityDegree_jwt',
        });

        // --- Phase 1: begin ---
        const { authorizationUrl, flowHandle } = await plugin.beginCredentialOfferAuthCode(
            offerUri,
            { redirectUri, clientId }
        );

        expect(flowHandle.tokenEndpoint).toBe(`${server.origin}/token`);
        expect(flowHandle.credentialEndpoint).toBe(`${server.origin}/credential`);
        expect(flowHandle.clientId).toBe(clientId);
        expect(flowHandle.pkceMethod).toBe('S256');

        // The URL goes to the local /authorize, with PKCE and all.
        const authUrl = new URL(authorizationUrl);
        expect(authUrl.origin + authUrl.pathname).toBe(`${server.origin}/authorize`);
        expect(authUrl.searchParams.get('response_type')).toBe('code');
        expect(authUrl.searchParams.get('code_challenge_method')).toBe('S256');
        expect(authUrl.searchParams.get('code_challenge')).toBeTruthy();

        // --- Simulated user-agent redirect ---
        const { code, state } = await followAuthorizeRedirect(authorizationUrl);
        expect(state).toBe(flowHandle.state);

        // --- Phase 2: complete ---
        const result = await plugin.completeCredentialOfferAuthCode({
            flowHandle,
            code,
            state,
        });

        expect(result.credentials).toHaveLength(1);
        expect(result.credentials[0].format).toBe('jwt_vc_json');
        expect(typeof result.credentials[0].credential).toBe('string');
        expect(result.credentials[0].configuration_id).toBe('UniversityDegree_jwt');
    });

    it('rejects a state mismatch at the complete phase', async () => {
        const mock = await buildMockLearnCard();
        const plugin = getPlugin(mock);

        const { offerUri } = createAuthCodeOffer(server.issuer, {
            configurationId: 'UniversityDegree_jwt',
        });

        const { authorizationUrl, flowHandle } = await plugin.beginCredentialOfferAuthCode(
            offerUri,
            { redirectUri: 'http://127.0.0.1:0/cb', clientId: 'test-wallet' }
        );

        const { code } = await followAuthorizeRedirect(authorizationUrl);

        await expect(
            plugin.completeCredentialOfferAuthCode({
                flowHandle,
                code,
                state: 'totally-different-state',
            })
        ).rejects.toMatchObject({ code: 'token_request_failed' });
    });

    it('rejects a tampered PKCE verifier at the token endpoint', async () => {
        const mock = await buildMockLearnCard();
        const plugin = getPlugin(mock);

        const { offerUri } = createAuthCodeOffer(server.issuer, {
            configurationId: 'UniversityDegree_jwt',
        });

        const { authorizationUrl, flowHandle } = await plugin.beginCredentialOfferAuthCode(
            offerUri,
            { redirectUri: 'http://127.0.0.1:0/cb', clientId: 'test-wallet' }
        );

        const { code, state } = await followAuthorizeRedirect(authorizationUrl);

        // Swap the verifier before completing — the AS will recompute
        // S256(v) and reject because it won't match the stored challenge.
        const tampered = {
            ...flowHandle,
            pkceVerifier: 'tampered-verifier-of-sufficient-base64url-length-for-the-guard',
        };

        await expect(
            plugin.completeCredentialOfferAuthCode({
                flowHandle: tampered,
                code,
                state,
            })
        ).rejects.toMatchObject({ code: 'token_request_failed' });
    });
});
