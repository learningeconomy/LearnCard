/**
 * Interop — **OID4VCI authorization_code + PKCE** against walt.id.
 *
 * Up until this spec, every wire test in the suite drove the
 * pre-authorized_code grant. That left Slice 4 (auth_code + PKCE)
 * with zero vendor-side coverage — its unit tests pass, but nothing
 * confirmed walt.id's authorization endpoint, token endpoint, and
 * credential endpoint accept what the plugin actually emits.
 *
 * What this proves end-to-end:
 *
 *   1. plugin.beginCredentialOfferAuthCode produces an
 *      authorization URL that walt.id accepts (correct AS endpoint,
 *      correct PKCE challenge, correct issuer state, correct
 *      authorization_details / scope shape).
 *
 *   2. walt.id's `/{standardVersion}/authorize` redirects with a
 *      `code` we can recover (proves the redirect_uri + state echo
 *      contract holds across the wallet/AS boundary).
 *
 *   3. plugin.completeCredentialOfferAuthCode exchanges the code at
 *      walt.id's token endpoint, uses the PKCE verifier, fetches the
 *      credential, and binds it to our holder DID.
 *
 * walt.id is told to mint the offer with `authenticationMethod:
 * 'NONE'` so its `/authorize` route auto-issues a code without
 * requiring a login UI — the only difference from a real wallet
 * flow is "no human in the loop", everything else (PKCE, code
 * exchange, proof JWT) runs end-to-end.
 */
import { describe, expect, it } from 'vitest';
import { decodeJwt } from 'jose';

import { getOpenID4VCPlugin } from '@learncard/openid4vc-plugin';

import {
    createIssuerKey,
    followWaltidAuthorize,
    mintWaltidOffer,
    resolveOfferToByValue,
} from '../setup/walt-id-client';
import { buildMockLearnCard, type MockLearnCardHandle } from './helpers/mock-learncard';

const ISSUER_BASE_URL = process.env.WALTID_ISSUER_BASE_URL ?? 'http://localhost:7002';

const getPlugin = (mock: MockLearnCardHandle) => {
    const plugin = getOpenID4VCPlugin(mock.learnCard, {});
    const bound: Record<string, (...args: any[]) => any> = {};
    for (const [name, fn] of Object.entries(plugin.methods)) {
        bound[name] = (...args: any[]) =>
            (fn as (...a: any[]) => any)(mock.learnCard, ...args);
    }
    return bound as any;
};

describe('interop: OID4VCI authorization_code + PKCE against walt.id', () => {
    it('completes the auth_code flow and receives a walt.id-signed JWT-VC', async () => {
        const mock = await buildMockLearnCard();
        const plugin = getPlugin(mock);

        const issuerKey = await createIssuerKey();

        // walt.id mints an offer with the authorization_code grant.
        // `authenticationMethod: 'NONE'` keeps the UA-side hop
        // headless — the /authorize route will redirect immediately
        // instead of pushing a login UI.
        const rawOfferUri = await mintWaltidOffer({
            issuerBaseUrl: ISSUER_BASE_URL,
            issuerKey,
            authenticationMethod: 'NONE',
        });
        const offerUri = await resolveOfferToByValue(rawOfferUri);

        // --- Phase 1: plugin builds the authorization URL ---
        // `redirectUri` doesn't need to be a real listener for this
        // test — `followWaltidAuthorize` reads the Location header
        // before any redirect actually happens.
        const begin = await plugin.beginCredentialOfferAuthCode(offerUri, {
            redirectUri: 'http://127.0.0.1:8765/cb',
            clientId: 'interop-test-wallet',
        });

        expect(typeof begin.authorizationUrl).toBe('string');
        expect(begin.authorizationUrl).toMatch(/^https?:\/\//);

        // PKCE check: the AS URL must carry a code_challenge with
        // method=S256 (the plugin doesn't support plain).
        const authUrl = new URL(begin.authorizationUrl);
        expect(authUrl.searchParams.get('code_challenge_method')).toBe('S256');
        expect(authUrl.searchParams.get('code_challenge')!.length).toBeGreaterThan(20);

        // The flow handle must echo the same PKCE verifier we'll
        // need at completion time.
        expect(begin.flowHandle.pkceMethod).toBe('S256');
        expect(typeof begin.flowHandle.pkceVerifier).toBe('string');
        expect(begin.flowHandle.pkceVerifier.length).toBeGreaterThan(20);

        // --- Phase 2: simulate the user-agent + AS redirect ---
        const { code, state } = await followWaltidAuthorize(begin.authorizationUrl);
        expect(typeof code).toBe('string');
        expect(code.length).toBeGreaterThan(0);

        // walt.id should echo the `state` we generated in phase 1.
        if (state) expect(state).toBe(begin.flowHandle.state);

        // --- Phase 3: plugin exchanges code → token → credential ---
        const result = await plugin.completeCredentialOfferAuthCode({
            flowHandle: begin.flowHandle,
            code,
            state,
        });

        expect(result.credentials).toHaveLength(1);
        const credentialEntry = result.credentials[0];
        expect(credentialEntry.format).toBe('jwt_vc_json');

        const vcJwt: string = credentialEntry.credential;
        const vcPayload = decodeJwt(vcJwt);

        // Issued by walt.id (using the per-run issuer key).
        expect(vcPayload.iss).toBe(issuerKey.did);

        // Bound to our holder DID — proves the proof JWT we emitted
        // in the credential request actually round-tripped.
        expect(vcPayload.sub).toBe(mock.did);

        const vc = (vcPayload as { vc?: Record<string, unknown> }).vc;
        expect(Array.isArray((vc as any)?.type)).toBe(true);
        expect((vc as any).type).toContain('VerifiableCredential');
    });
});
