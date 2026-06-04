/**
 * Slice 8 e2e — SIOPv2 combined flow.
 *
 * Verifier sets `response_type=vp_token id_token`; the plugin MUST
 * sign and submit both tokens. The in-process verifier rejects
 * submissions that omit `id_token` on a combined flow, so this test
 * actually proves the wiring from `presentCredentials` down through
 * `submitPresentation`'s form encoding.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getOpenID4VCPlugin } from '@learncard/openid4vc-plugin';

import { startE2EServer, type E2EServerHandle } from '../server/server';
import { createPreAuthOffer } from '../server/issuer';
import { createSession } from '../server/verifier';
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

describe('e2e: SIOPv2 combined flow (vp_token id_token)', () => {
    it('presentCredentials auto-emits an id_token when response_type requires one', async () => {
        const mock = await buildMockLearnCard();
        const plugin = getPlugin(mock);

        // Issue a credential the verifier can ask for.
        const { offerUri } = createPreAuthOffer(server.issuer, {
            configurationId: 'UniversityDegree_jwt',
        });
        const accepted = await plugin.acceptCredentialOffer(offerUri);

        // Create a verifier session that *requires* the combined flow.
        const session = createSession(server.verifier, {
            presentationDefinition: {
                id: 'pd-siop',
                input_descriptors: [
                    {
                        id: 'UniversityDegree',
                        constraints: {
                            fields: [
                                {
                                    path: ['$.type', '$.vc.type'],
                                    filter: {
                                        type: 'array',
                                        contains: { const: 'UniversityDegree' },
                                    },
                                },
                            ],
                        },
                    },
                ],
            },
            includeSiop: true,
        });

        expect(session.responseType).toBe('vp_token id_token');

        const result = await plugin.presentCredentials(
            session.authRequestUri,
            [
                {
                    descriptorId: 'UniversityDegree',
                    candidate: {
                        credential: accepted.credentials[0].credential,
                        format: 'jwt_vc_json',
                    },
                },
            ],
            { envelopeFormat: 'jwt_vp_json' }
        );

        // Plugin produced both tokens.
        expect(result.signed.vpFormat).toBe('jwt_vp_json');
        expect(typeof result.signed.vpToken).toBe('string');
        expect(result.signedIdToken?.idToken).toBeDefined();
        expect(typeof result.signedIdToken!.idToken).toBe('string');

        // Verifier was happy with both.
        expect(result.submitted.status).toBe(200);

        const record = server.verifier.sessions.get(session.id)!.submissions[0]!;
        expect(record.verifierAccepted).toBe(true);

        // id_token carries the expected SIOPv2 claims.
        const idPayload = record.decodedIdToken?.payload as Record<string, unknown>;
        expect(idPayload.iss).toBe(mock.did);
        expect(idPayload.sub).toBe(mock.did);
        expect(idPayload.aud).toBe(session.clientId);
        expect(idPayload.nonce).toBe(session.nonce);

        // And the id_token shared the same holder key as the VP.
        const vpPayload = record.decodedVp?.payload as Record<string, unknown>;
        expect(vpPayload.iss).toBe(idPayload.sub);
    });

    it('verifier rejects a vp-only submission when the request required id_token', async () => {
        const mock = await buildMockLearnCard();
        const plugin = getPlugin(mock);

        const { offerUri } = createPreAuthOffer(server.issuer, {
            configurationId: 'UniversityDegree_jwt',
        });
        const accepted = await plugin.acceptCredentialOffer(offerUri);

        const session = createSession(server.verifier, {
            presentationDefinition: {
                id: 'pd-siop-reject',
                input_descriptors: [
                    {
                        id: 'UniversityDegree',
                        constraints: {
                            fields: [{ path: ['$.type', '$.vc.type'] }],
                        },
                    },
                ],
            },
            includeSiop: true,
        });

        // Manually re-point the auth request URI to claim a
        // vp_token-only response_type, so the plugin skips signing
        // the id_token. The verifier still remembers the real
        // response_type for its session and will reject.
        const tampered = session.authRequestUri.replace(
            'response_type=vp_token+id_token',
            'response_type=vp_token'
        );

        await expect(
            plugin.presentCredentials(
                tampered,
                [
                    {
                        descriptorId: 'UniversityDegree',
                        candidate: {
                            credential: accepted.credentials[0].credential,
                            format: 'jwt_vc_json',
                        },
                    },
                ],
                { envelopeFormat: 'jwt_vp_json' }
            )
        ).rejects.toMatchObject({
            name: 'VpSubmitError',
            code: 'server_error',
            status: 400,
        });
    });
});
