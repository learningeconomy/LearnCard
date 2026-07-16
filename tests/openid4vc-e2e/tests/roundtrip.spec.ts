/**
 * Full issue-then-present round trip over real HTTP against the
 * in-process issuer + verifier. Exercises Slices 2, 3, 6, 7 (+7.5)
 * end-to-end through the plugin's public API.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getOpenID4VCPlugin, requestW3cVc } from '@learncard/openid4vc-plugin';

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

/**
 * Bind the plugin's methods to the mock learnCard so tests can call
 * `plugin.presentCredentials(...)` without plumbing the host arg at
 * every call site.
 */
const getPlugin = (mock: MockLearnCardHandle) => {
    const plugin = getOpenID4VCPlugin(mock.learnCard, {});
    const bound: Record<string, (...args: any[]) => any> = {};
    for (const [name, fn] of Object.entries(plugin.methods)) {
        bound[name] = (...args: any[]) => (fn as (...a: any[]) => any)(mock.learnCard, ...args);
    }
    return bound as any;
};

describe('e2e: issue → present round trip', () => {
    it('accepts a pre-auth credential offer and presents it to a verifier', async () => {
        const mock = await buildMockLearnCard();
        const plugin = getPlugin(mock);

        // -------- 1. Issue --------
        const { offerUri } = createPreAuthOffer(server.issuer, {
            configurationId: 'UniversityDegree_jwt',
        });

        const accepted = await plugin.acceptCredentialOffer(offerUri);

        expect(accepted.credentials).toHaveLength(1);
        expect(accepted.credentials[0].format).toBe('jwt_vc_json');
        expect(typeof accepted.credentials[0].credential).toBe('string');

        // -------- 2. Present --------
        const session = await createSession(server.verifier, {
            presentationDefinition: {
                id: 'pd-e2e',
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
        });

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

        expect(result.submitted.status).toBe(200);
        expect(result.submitted.redirectUri).toBe(session.acceptedRedirect);

        // Verifier booked the submission and was satisfied with both
        // signature + replay bindings.
        expect(session.submissions).toHaveLength(1);
        const record = session.submissions[0]!;
        expect(record.verifierAccepted).toBe(true);
        expect(record.rejectionReason).toBeUndefined();

        const vpPayload = record.decodedVp?.payload as Record<string, unknown>;
        expect(vpPayload.iss).toBe(mock.did);
        expect(vpPayload.aud).toBe(session.clientId);
        expect(vpPayload.nonce).toBe(session.nonce);
    });
});

describe('e2e: pre-auth with tx_code', () => {
    it('requires and validates the tx_code when the offer demands one', async () => {
        const mock = await buildMockLearnCard();
        const plugin = getPlugin(mock);

        const { offerUri } = createPreAuthOffer(server.issuer, {
            configurationId: 'UniversityDegree_jwt',
            txCode: '1234',
        });

        // Without tx_code → issuer rejects with invalid_grant.
        await expect(plugin.acceptCredentialOffer(offerUri)).rejects.toThrow();

        // With the correct tx_code → offer is accepted.
        const offerB = createPreAuthOffer(server.issuer, {
            configurationId: 'UniversityDegree_jwt',
            txCode: '9876',
        });

        const accepted = await plugin.acceptCredentialOffer(offerB.offerUri, {
            txCode: '9876',
        });

        expect(accepted.credentials).toHaveLength(1);
    });
});

describe('e2e: verifier rejection surfaces VpSubmitError', () => {
    it('bubbles a 400 from the verifier with the server body', async () => {
        const mock = await buildMockLearnCard();
        const plugin = getPlugin(mock);

        // Issue one credential first so we have something to present.
        const { offerUri } = createPreAuthOffer(server.issuer, {
            configurationId: 'UniversityDegree_jwt',
        });
        const accepted = await plugin.acceptCredentialOffer(offerUri);

        // PD that will match — but we'll later corrupt the submission
        // state so the verifier rejects.
        const session = await createSession(server.verifier, {
            presentationDefinition: {
                id: 'pd-reject',
                input_descriptors: [
                    {
                        id: 'UniversityDegree',
                        constraints: {
                            fields: [{ path: ['$.type', '$.vc.type'] }],
                        },
                    },
                ],
            },
        });

        // Force a state mismatch by pointing the wallet at a URI with
        // a tampered `state` param.
        const tampered = session.authRequestUri.replace(
            `state=${session.state}`,
            'state=this-is-wrong'
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

    /* -------------------------------------------------------------------------- */
    /*                          OID4VP 1.0 presentation path                      */
    /* -------------------------------------------------------------------------- */

    const universityDegreePd = (id: string) => ({
        id,
        input_descriptors: [
            {
                id: 'UniversityDegree',
                constraints: {
                    fields: [
                        {
                            path: ['$.type', '$.vc.type'],
                            filter: { type: 'array', contains: { const: 'UniversityDegree' } },
                        },
                    ],
                },
            },
        ],
    });

    const issueDegree = async (plugin: any) => {
        const { offerUri } = createPreAuthOffer(server.issuer, {
            configurationId: 'UniversityDegree_jwt',
        });
        const accepted = await plugin.acceptCredentialOffer(offerUri);
        return accepted.credentials[0].credential as string;
    };

    describe('e2e: DCQL roundtrip (OID4VP 1.0 query language)', () => {
        it('presents via DCQL and the verifier accepts the query-keyed vp_token (no presentation_submission)', async () => {
            const mock = await buildMockLearnCard();
            const plugin = getPlugin(mock);
            const credential = await issueDegree(plugin);

            const dcqlQuery = requestW3cVc({
                id: 'degree',
                types: ['VerifiableCredential', 'UniversityDegree'],
            });

            const session = await createSession(server.verifier, {
                dcqlQuery: dcqlQuery as unknown as Record<string, unknown>,
            });

            const result = await plugin.presentCredentials(session.authRequestUri, [
                { credentialQueryId: 'degree', candidate: { credential, format: 'jwt_vc_json' } },
            ]);

            expect(result.submitted.status).toBe(200);
            expect(result.dcqlVpToken).toEqual(
                expect.objectContaining({ degree: expect.any(String) })
            );

            const record = session.submissions[0]!;
            expect(record.verifierAccepted).toBe(true);
            expect(record.rejectionReason).toBeUndefined();
            // §6.4: DCQL responses carry no presentation_submission.
            expect(record.form.presentation_submission).toBeUndefined();
        });
    });

    describe('e2e: JARM direct_post.jwt (OID4VP 1.0 encrypted response)', () => {
        it('encrypts the response, negotiating enc via encrypted_response_enc_values_supported', async () => {
            const mock = await buildMockLearnCard();
            const plugin = getPlugin(mock);
            const credential = await issueDegree(plugin);

            const session = await createSession(server.verifier, {
                presentationDefinition: universityDegreePd('pd-jarm'),
                encryptResponse: true,
            });

            const result = await plugin.presentCredentials(
                session.authRequestUri,
                [
                    {
                        descriptorId: 'UniversityDegree',
                        candidate: { credential, format: 'jwt_vc_json' },
                    },
                ],
                { envelopeFormat: 'jwt_vp_json' }
            );

            expect(result.submitted.status).toBe(200);

            const record = session.submissions[0]!;
            expect(record.verifierAccepted).toBe(true);
            expect(record.rejectionReason).toBeUndefined();
            // The wallet sent an encrypted `response` (JARM), not a cleartext vp_token,
            // and the verifier decrypted it with its A128GCM-advertised key.
            expect(record.form.response).toBeDefined();
            expect(record.form.vp_token).toBeUndefined();
        });
    });

    describe('e2e: transaction_data is rejected (OID4VP 1.0 §8.4)', () => {
        it('throws invalid_transaction_data and submits nothing to the verifier', async () => {
            const mock = await buildMockLearnCard();
            const plugin = getPlugin(mock);
            const credential = await issueDegree(plugin);

            const txData = Buffer.from(
                JSON.stringify({ type: 'example_type', credential_ids: ['UniversityDegree'] })
            ).toString('base64url');

            const session = await createSession(server.verifier, {
                presentationDefinition: universityDegreePd('pd-txdata'),
                transactionData: [txData],
            });

            await expect(
                plugin.presentCredentials(
                    session.authRequestUri,
                    [
                        {
                            descriptorId: 'UniversityDegree',
                            candidate: { credential, format: 'jwt_vc_json' },
                        },
                    ],
                    { envelopeFormat: 'jwt_vp_json' }
                )
            ).rejects.toMatchObject({ code: 'invalid_transaction_data' });

            expect(session.submissions).toHaveLength(0);
        });
    });
});
