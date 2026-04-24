import { acceptCredentialOffer } from './accept';
import { CredentialOffer, PRE_AUTHORIZED_CODE_GRANT } from '../offer/types';
import { ProofJwtSigner } from './types';

const mockResponse = (body: unknown, init: { ok?: boolean; status?: number } = {}) =>
    ({
        ok: init.ok ?? true,
        status: init.status ?? 200,
        json: async () => body,
    } as unknown as Response);

const baseOffer: CredentialOffer = {
    credential_issuer: 'https://issuer.example.com',
    credential_configuration_ids: ['UniversityDegree_jwt_vc_json'],
    grants: {
        [PRE_AUTHORIZED_CODE_GRANT]: {
            'pre-authorized_code': 'pa-code',
        },
    },
};

const issuerMetadata = {
    credential_issuer: 'https://issuer.example.com',
    credential_endpoint: 'https://issuer.example.com/credential',
    credential_configurations_supported: {
        UniversityDegree_jwt_vc_json: { format: 'jwt_vc_json' },
    },
};

const asMetadata = {
    issuer: 'https://issuer.example.com',
    token_endpoint: 'https://issuer.example.com/token',
};

const tokenResponse = {
    access_token: 'access-abc',
    token_type: 'Bearer',
    c_nonce: 'nonce-xyz',
    c_nonce_expires_in: 600,
};

const credentialResponse = {
    credential: 'eyJ.vc.jwt',
    notification_id: 'notif-1',
};

const fakeSigner: ProofJwtSigner = {
    alg: 'EdDSA',
    kid: 'did:key:z6Mk#z6Mk',
    sign: jest.fn().mockResolvedValue('proof.jwt.sig'),
};

const makeFetch = (responses: unknown[]) => {
    const mock = jest.fn();
    for (const r of responses) mock.mockResolvedValueOnce(r);
    return mock as unknown as typeof fetch;
};

describe('acceptCredentialOffer', () => {
    beforeEach(() => {
        (fakeSigner.sign as jest.Mock).mockClear();
    });

    it('drives the full pre-authorized_code flow end-to-end', async () => {
        const fetchMock = makeFetch([
            mockResponse(issuerMetadata), // issuer metadata
            mockResponse(asMetadata), // AS metadata (oauth path)
            mockResponse(tokenResponse), // token endpoint
            mockResponse(credentialResponse), // credential endpoint
        ]);

        const result = await acceptCredentialOffer({
            offer: baseOffer,
            signer: fakeSigner,
            fetchImpl: fetchMock,
        });

        expect(result.credentials).toHaveLength(1);
        expect(result.credentials[0]).toEqual({
            format: 'jwt_vc_json',
            credential: 'eyJ.vc.jwt',
            configuration_id: 'UniversityDegree_jwt_vc_json',
        });
        expect(result.notification_id).toBe('notif-1');

        // Verify the proof JWT was built with the issuer's nonce.
        expect(fakeSigner.sign).toHaveBeenCalledTimes(1);
        const signCall = (fakeSigner.sign as jest.Mock).mock.calls[0];
        expect(signCall[1]).toMatchObject({
            aud: 'https://issuer.example.com',
            nonce: 'nonce-xyz',
        });
    });

    it('throws unsupported_grant when offer lacks pre-authorized_code grant', async () => {
        const offerWithoutGrant: CredentialOffer = {
            ...baseOffer,
            grants: { authorization_code: { issuer_state: 'state' } },
        };

        await expect(
            acceptCredentialOffer({
                offer: offerWithoutGrant,
                signer: fakeSigner,
                fetchImpl: jest.fn() as unknown as typeof fetch,
            })
        ).rejects.toMatchObject({ code: 'unsupported_grant' });
    });

    it('throws tx_code_required when offer requires tx_code and none supplied', async () => {
        const offerWithTxCode: CredentialOffer = {
            ...baseOffer,
            grants: {
                [PRE_AUTHORIZED_CODE_GRANT]: {
                    'pre-authorized_code': 'pa',
                    tx_code: { input_mode: 'numeric', length: 4 },
                },
            },
        };

        await expect(
            acceptCredentialOffer({
                offer: offerWithTxCode,
                signer: fakeSigner,
                fetchImpl: jest.fn() as unknown as typeof fetch,
            })
        ).rejects.toMatchObject({ code: 'tx_code_required' });
    });

    it('passes tx_code through to the token endpoint', async () => {
        const offerWithTxCode: CredentialOffer = {
            ...baseOffer,
            grants: {
                [PRE_AUTHORIZED_CODE_GRANT]: {
                    'pre-authorized_code': 'pa',
                    tx_code: { input_mode: 'numeric', length: 4 },
                },
            },
        };

        const fetchMock = makeFetch([
            mockResponse(issuerMetadata),
            mockResponse(asMetadata),
            mockResponse(tokenResponse),
            mockResponse(credentialResponse),
        ]);

        await acceptCredentialOffer({
            offer: offerWithTxCode,
            signer: fakeSigner,
            options: { txCode: '1234' },
            fetchImpl: fetchMock,
        });

        // Third call is token endpoint POST.
        const tokenCall = (fetchMock as unknown as jest.Mock).mock.calls[2];
        const body = new URLSearchParams(tokenCall[1].body);
        expect(body.get('tx_code')).toBe('1234');
    });

    it('handles batch `credentials` array in response', async () => {
        const batchResponse = {
            credentials: [
                { credential: 'vc1' },
                { credential: 'vc2' },
            ],
        };

        const fetchMock = makeFetch([
            mockResponse(issuerMetadata),
            mockResponse(asMetadata),
            mockResponse(tokenResponse),
            mockResponse(batchResponse),
        ]);

        const result = await acceptCredentialOffer({
            offer: baseOffer,
            signer: fakeSigner,
            fetchImpl: fetchMock,
        });

        expect(result.credentials).toHaveLength(2);
        expect(result.credentials[0].credential).toBe('vc1');
        expect(result.credentials[1].credential).toBe('vc2');
    });

    it('filters to a subset of credential configuration ids when configurationIds option is set', async () => {
        const multiOffer: CredentialOffer = {
            ...baseOffer,
            credential_configuration_ids: [
                'UniversityDegree_jwt_vc_json',
                'StudentId_jwt_vc_json',
            ],
        };

        const fetchMock = makeFetch([
            mockResponse(issuerMetadata),
            mockResponse(asMetadata),
            mockResponse(tokenResponse),
            mockResponse(credentialResponse),
            mockResponse(credentialResponse),
        ]);

        const result = await acceptCredentialOffer({
            offer: multiOffer,
            signer: fakeSigner,
            options: { configurationIds: ['UniversityDegree_jwt_vc_json'] },
            fetchImpl: fetchMock,
        });

        expect(result.credentials).toHaveLength(1);
        expect(result.credentials[0].configuration_id).toBe('UniversityDegree_jwt_vc_json');
        // Only one credential-endpoint call since we filtered to one id.
        expect((fetchMock as unknown as jest.Mock).mock.calls).toHaveLength(4);
    });

    it('throws unsupported_format when the filter yields no matches', async () => {
        await expect(
            acceptCredentialOffer({
                offer: baseOffer,
                signer: fakeSigner,
                options: { configurationIds: ['NotInOffer'] },
                fetchImpl: jest.fn() as unknown as typeof fetch,
            })
        ).rejects.toMatchObject({ code: 'unsupported_format' });
    });
});
