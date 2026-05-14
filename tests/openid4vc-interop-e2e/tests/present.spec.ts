/**
 * Interop — **present** side of OID4VP against a real walt.id verifier.
 *
 * Narrow focus: the plugin can correctly parse and resolve a live
 * walt.id-emitted Authorization Request. The full issue→present
 * round trip lives in `roundtrip.spec.ts`; this spec targets the
 * request-parsing surface specifically so drift in walt.id's URL
 * shape is caught even when we haven't got a presentable credential
 * on hand.
 */
import { describe, expect, it } from 'vitest';
import { getOpenID4VCPlugin } from '@learncard/openid4vc-plugin';

import {
    createWaltidVerifySession,
    resolveAuthorizationRequestToByValue,
} from '../setup/walt-id-client';
import { buildMockLearnCard, type MockLearnCardHandle } from './helpers/mock-learncard';

const VERIFIER_BASE_URL = process.env.WALTID_VERIFIER_BASE_URL ?? 'http://localhost:7003';

const getPlugin = (mock: MockLearnCardHandle) => {
    const plugin = getOpenID4VCPlugin(mock.learnCard, {});
    const bound: Record<string, (...args: any[]) => any> = {};
    for (const [name, fn] of Object.entries(plugin.methods)) {
        bound[name] = (...args: any[]) =>
            (fn as (...a: any[]) => any)(mock.learnCard, ...args);
    }
    return bound as any;
};

describe('interop: OID4VP authorization request from walt.id', () => {
    it('resolves a walt.id-generated Authorization Request into a spec-valid shape', async () => {
        const mock = await buildMockLearnCard();
        const plugin = getPlugin(mock);

        // walt.id mints a verification session for a single JWT VC.
        const session = await createWaltidVerifySession({
            verifierBaseUrl: VERIFIER_BASE_URL,
            requestCredentials: [{ type: 'UniversityDegree', format: 'jwt_vc_json' }],
        });

        // Rewrite presentation_definition_uri → presentation_definition
        // by value (same rationale as the offer rewriter — the plugin
        // requires https:// on PD-by-reference).
        const authRequestUri = await resolveAuthorizationRequestToByValue(
            session.authorizationRequestUri
        );

        // The plugin's resolver is the surface under test.
        const resolved = await plugin.resolveAuthorizationRequest(authRequestUri);

        // Core OID4VP fields walt.id must emit.
        expect(resolved.response_type).toContain('vp_token');
        expect(resolved.response_mode).toBe('direct_post');
        expect(typeof resolved.nonce).toBe('string');
        expect(resolved.nonce!.length).toBeGreaterThan(0);
        expect(resolved.state).toBe(session.state);

        // Either `response_uri` (direct_post) or `redirect_uri` must
        // be set — the plugin treats them interchangeably at submit
        // time. walt.id uses `response_uri` on direct_post.
        const submitTarget = resolved.response_uri ?? resolved.redirect_uri;
        expect(typeof submitTarget).toBe('string');
        expect(submitTarget).toMatch(/^https?:\/\//);

        // The PD we inlined must survive the round trip.
        expect(resolved.presentation_definition).toBeDefined();
        const pd = resolved.presentation_definition as {
            input_descriptors?: unknown[];
            id?: string;
        };
        expect(Array.isArray(pd.input_descriptors)).toBe(true);
        expect(pd.input_descriptors!.length).toBeGreaterThan(0);
    });
});
