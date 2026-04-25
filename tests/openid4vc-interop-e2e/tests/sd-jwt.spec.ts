/**
 * Interop — **SD-JWT VC issuance** against walt.id.
 *
 * Selective-disclosure JWT VCs (`vc+sd-jwt`, IETF draft) are a
 * different beast from `jwt_vc_json`:
 *
 * - The credential is a JWT followed by zero-or-more `~`-separated
 *   selective-disclosure salts and an optional Key Binding JWT.
 * - Holder binding uses a `cnf` claim with a JWK rather than a DID
 *   in the `sub` field.
 * - Verifier-driven disclosure happens at presentation time, not
 *   issuance time.
 *
 * This spec proves the plugin can:
 *
 *   1. Parse a walt.id offer that advertises an `vc+sd-jwt` config.
 *   2. Run the credential request flow and receive whatever string
 *      walt.id emits as the credential value.
 *   3. Recognise the format on the response.
 *
 * Presentation of SD-JWT VCs (which involves building a Key Binding
 * JWT and selectively disclosing claims) is intentionally *out of
 * scope* — it's a separate code path that warrants its own spec
 * with explicit disclosure-selection coverage. This test is the
 * issuance-side floor.
 *
 * The walt.id default credential registry may or may not ship an
 * SD-JWT config; we discover one dynamically from the metadata at
 * `/draft13/.well-known/openid-credential-issuer`. If the registry
 * has no `vc+sd-jwt` configurations, the test fails loudly with a
 * useful error rather than silently passing on a no-op — that's the
 * right behaviour, because if our test suite couldn't find an
 * SD-JWT config to interop against, neither could real wallets.
 */
import { describe, expect, it } from 'vitest';

import { getOpenID4VCPlugin } from '@learncard/openid4vc-plugin';

import {
    createIssuerKey,
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

interface CredentialConfig {
    format?: string;
    [key: string]: unknown;
}

/**
 * Walk walt.id's `credential_configurations_supported` for any
 * SD-JWT-shaped entry. Accepts either `vc+sd-jwt` (W3C SD-JWT VC
 * draft) or `dc+sd-jwt` (IETF dc-sd-jwt) — different walt.id
 * builds use slightly different format strings.
 */
const findSdJwtConfigId = async (): Promise<{
    configId: string;
    format: string;
    config: CredentialConfig;
}> => {
    const res = await fetch(
        `${ISSUER_BASE_URL}/draft13/.well-known/openid-credential-issuer`
    );
    if (!res.ok) {
        throw new Error(
            `Could not fetch walt.id issuer metadata: HTTP ${res.status}`
        );
    }

    const body = (await res.json()) as {
        credential_configurations_supported?: Record<string, CredentialConfig>;
    };

    const configs = body.credential_configurations_supported ?? {};
    const sdJwtFormats = ['vc+sd-jwt', 'dc+sd-jwt', 'sd-jwt-vc'];

    for (const [configId, config] of Object.entries(configs)) {
        if (typeof config.format === 'string' && sdJwtFormats.includes(config.format)) {
            return { configId, format: config.format, config };
        }
    }

    throw new Error(
        `walt.id's bundled credential registry has no SD-JWT-shaped configurations. ` +
            `Available configs: ${Object.keys(configs).join(', ')}. ` +
            `Either mount a credential-issuer-metadata.conf with an SD-JWT entry, ` +
            `or pin a walt.id image whose default registry includes one.`
    );
};

describe('interop: SD-JWT VC issuance against walt.id', () => {
    it('accepts a walt.id SD-JWT offer and receives the credential', async () => {
        const mock = await buildMockLearnCard();
        const plugin = getPlugin(mock);

        const issuerKey = await createIssuerKey();

        // 1. Discover a real SD-JWT config from walt.id's running metadata.
        const { configId, format, config } = await findSdJwtConfigId();
        expect(typeof configId).toBe('string');
        expect(format).toMatch(/sd-jwt/);

        // 2. Mint an offer for it. walt.id pulls the type info from
        //    the registry entry, so we don't pass our own credentialType.
        const rawOfferUri = await mintWaltidOffer({
            issuerBaseUrl: ISSUER_BASE_URL,
            issuerKey,
            credentialConfigurationId: configId,
            credentialType: typeof (config as any).vct === 'string'
                ? ((config as any).vct as string).split('/').pop()!
                : 'SdJwtCredential',
            subjectClaims: { givenName: 'Alice', familyName: 'Example' },
        });
        const offerUri = await resolveOfferToByValue(rawOfferUri);

        // 3. Plugin runs the full VCI flow.
        const result = await plugin.acceptCredentialOffer(offerUri);

        expect(result.credentials).toHaveLength(1);
        const credentialEntry = result.credentials[0];

        // The plugin should report the SD-JWT format on the bundle.
        expect(credentialEntry.format).toBe(format);

        const credential: string = credentialEntry.credential;
        expect(typeof credential).toBe('string');
        expect(credential.length).toBeGreaterThan(0);

        // SD-JWT VCs are tilde-separated: <jwt>~<disclosure>~...~<kb-jwt>?
        // The first segment must itself be a valid 3-part JWT.
        const segments = credential.split('~');
        expect(segments.length).toBeGreaterThanOrEqual(1);

        const jwtPart = segments[0]!;
        expect(jwtPart.split('.').length).toBe(3);
    });
});
