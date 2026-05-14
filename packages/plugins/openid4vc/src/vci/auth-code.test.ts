import {
    AUTHORIZATION_CODE_GRANT,
    beginAuthCodeFlow,
    buildAuthorizationUrl,
    completeAuthCodeFlow,
    exchangeAuthorizationCode,
} from './auth-code';
import { CredentialOffer } from '../offer/types';
import { generatePkcePair } from './pkce';
import { ProofJwtSigner } from './types';
import { VciError } from './errors';

/* ---------------------------------- fixtures -------------------------------- */

const ISSUER = 'https://issuer.example.com';
const AUTH_ENDPOINT = 'https://as.example.com/authorize';
const TOKEN_ENDPOINT = 'https://as.example.com/token';
const CREDENTIAL_ENDPOINT = 'https://issuer.example.com/credential';
const CLIENT_ID = 'wallet-client-id';
const REDIRECT_URI = 'http://127.0.0.1:54321/cb';

const offerWithAuthCode: CredentialOffer = {
    credential_issuer: ISSUER,
    credential_configuration_ids: ['UniversityDegree_jwt'],
    grants: {
        authorization_code: {
            issuer_state: 'issuer-state-xyz',
        },
    },
};

const issuerMetadata = {
    credential_issuer: ISSUER,
    credential_endpoint: CREDENTIAL_ENDPOINT,
    authorization_servers: ['https://as.example.com'],
    credential_configurations_supported: {
        UniversityDegree_jwt: {
            format: 'jwt_vc_json',
            credential_definition: { type: ['VerifiableCredential', 'UniversityDegree'] },
        },
    },
};

const asMetadata = {
    issuer: 'https://as.example.com',
    token_endpoint: TOKEN_ENDPOINT,
    authorization_endpoint: AUTH_ENDPOINT,
};

const mockResponse = (body: unknown, init: { ok?: boolean; status?: number } = {}) =>
    ({
        ok: init.ok ?? true,
        status: init.status ?? 200,
        json: async () => body,
    } as unknown as Response);

const fakeSigner: ProofJwtSigner = {
    alg: 'EdDSA',
    kid: 'did:jwk:holder#0',
    sign: jest.fn().mockResolvedValue('proof.jwt.sig'),
};

/* --------------------------------- tests ---------------------------------- */

describe('buildAuthorizationUrl', () => {
    it('includes response_type=code, PKCE, redirect_uri, and authorization_details', async () => {
        const pkce = await generatePkcePair();

        const url = buildAuthorizationUrl({
            authorizationEndpoint: AUTH_ENDPOINT,
            clientId: CLIENT_ID,
            redirectUri: REDIRECT_URI,
            configurationIds: ['UniversityDegree_jwt'],
            pkce,
            state: 'abc123',
        });

        const parsed = new URL(url);
        expect(parsed.searchParams.get('response_type')).toBe('code');
        expect(parsed.searchParams.get('client_id')).toBe(CLIENT_ID);
        expect(parsed.searchParams.get('redirect_uri')).toBe(REDIRECT_URI);
        expect(parsed.searchParams.get('code_challenge')).toBe(pkce.challenge);
        expect(parsed.searchParams.get('code_challenge_method')).toBe('S256');
        expect(parsed.searchParams.get('state')).toBe('abc123');

        const details = JSON.parse(parsed.searchParams.get('authorization_details') ?? '[]');
        expect(details).toEqual([
            {
                type: 'openid_credential',
                credential_configuration_id: 'UniversityDegree_jwt',
            },
        ]);
    });

    it('appends issuer_state when supplied (Draft 13 §5.1.1)', async () => {
        const pkce = await generatePkcePair();
        const url = buildAuthorizationUrl({
            authorizationEndpoint: AUTH_ENDPOINT,
            clientId: CLIENT_ID,
            redirectUri: REDIRECT_URI,
            configurationIds: ['UniversityDegree_jwt'],
            pkce,
            state: 's',
            issuerState: 'issuer-state-xyz',
        });

        expect(new URL(url).searchParams.get('issuer_state')).toBe('issuer-state-xyz');
    });

    it('omits scope when not supplied', async () => {
        const pkce = await generatePkcePair();
        const url = buildAuthorizationUrl({
            authorizationEndpoint: AUTH_ENDPOINT,
            clientId: CLIENT_ID,
            redirectUri: REDIRECT_URI,
            configurationIds: ['X'],
            pkce,
            state: 's',
        });

        expect(new URL(url).searchParams.has('scope')).toBe(false);
    });
});

describe('exchangeAuthorizationCode', () => {
    it('POSTs code + code_verifier + client_id + redirect_uri', async () => {
        const fetchMock = jest.fn().mockResolvedValue(
            mockResponse({
                access_token: 'at-123',
                token_type: 'Bearer',
                c_nonce: 'cn-456',
            })
        );

        const result = await exchangeAuthorizationCode({
            tokenEndpoint: TOKEN_ENDPOINT,
            code: 'code-abc',
            codeVerifier: 'verifier-xyz',
            clientId: CLIENT_ID,
            redirectUri: REDIRECT_URI,
            fetchImpl: fetchMock as unknown as typeof fetch,
        });

        expect(result.access_token).toBe('at-123');
        expect(result.c_nonce).toBe('cn-456');

        const call = fetchMock.mock.calls[0]!;
        expect(call[0]).toBe(TOKEN_ENDPOINT);

        const body = new URLSearchParams(call[1].body as string);
        expect(body.get('grant_type')).toBe(AUTHORIZATION_CODE_GRANT);
        expect(body.get('code')).toBe('code-abc');
        expect(body.get('code_verifier')).toBe('verifier-xyz');
        expect(body.get('client_id')).toBe(CLIENT_ID);
        expect(body.get('redirect_uri')).toBe(REDIRECT_URI);
    });

    it('throws VciError(token_request_failed) on 400', async () => {
        const fetchMock = jest.fn().mockResolvedValue(
            mockResponse({ error: 'invalid_grant', error_description: 'bad code' }, { ok: false, status: 400 })
        );

        await expect(
            exchangeAuthorizationCode({
                tokenEndpoint: TOKEN_ENDPOINT,
                code: 'code',
                codeVerifier: 'v',
                clientId: CLIENT_ID,
                redirectUri: REDIRECT_URI,
                fetchImpl: fetchMock as unknown as typeof fetch,
            })
        ).rejects.toMatchObject({ code: 'token_request_failed' });
    });
});

describe('beginAuthCodeFlow', () => {
    it('assembles an authorization URL + returns a flowHandle', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce(mockResponse(issuerMetadata))
            .mockResolvedValueOnce(mockResponse(asMetadata));

        const { authorizationUrl, flowHandle } = await beginAuthCodeFlow({
            offer: offerWithAuthCode,
            clientId: CLIENT_ID,
            redirectUri: REDIRECT_URI,
            fetchImpl: fetchMock as unknown as typeof fetch,
        });

        const parsed = new URL(authorizationUrl);
        expect(parsed.origin + parsed.pathname).toBe(AUTH_ENDPOINT);
        expect(parsed.searchParams.get('client_id')).toBe(CLIENT_ID);
        expect(parsed.searchParams.get('code_challenge_method')).toBe('S256');

        expect(flowHandle.tokenEndpoint).toBe(TOKEN_ENDPOINT);
        expect(flowHandle.credentialEndpoint).toBe(CREDENTIAL_ENDPOINT);
        expect(flowHandle.pkceVerifier.length).toBeGreaterThan(40);
        expect(flowHandle.state).toHaveLength(32); // 16 random bytes hex-encoded
    });

    it('rejects offers that lack the authorization_code grant', async () => {
        const preAuthOffer: CredentialOffer = {
            credential_issuer: ISSUER,
            credential_configuration_ids: ['X'],
            grants: {
                'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
                    'pre-authorized_code': 'xxx',
                },
            },
        };

        await expect(
            beginAuthCodeFlow({
                offer: preAuthOffer,
                clientId: CLIENT_ID,
                redirectUri: REDIRECT_URI,
            })
        ).rejects.toMatchObject({ code: 'unsupported_grant' });
    });

    it('rejects missing redirect_uri / client_id', async () => {
        await expect(
            beginAuthCodeFlow({
                offer: offerWithAuthCode,
                clientId: '',
                redirectUri: REDIRECT_URI,
            })
        ).rejects.toBeInstanceOf(VciError);

        await expect(
            beginAuthCodeFlow({
                offer: offerWithAuthCode,
                clientId: CLIENT_ID,
                redirectUri: '',
            })
        ).rejects.toBeInstanceOf(VciError);
    });

    it('validates configurationIds filter before hitting the network', async () => {
        await expect(
            beginAuthCodeFlow({
                offer: offerWithAuthCode,
                clientId: CLIENT_ID,
                redirectUri: REDIRECT_URI,
                configurationIds: ['non-existent'],
            })
        ).rejects.toMatchObject({ code: 'unsupported_format' });
    });

    it('throws metadata_invalid when AS metadata lacks authorization_endpoint', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce(mockResponse(issuerMetadata))
            .mockResolvedValueOnce(
                mockResponse({ issuer: 'https://as.example.com', token_endpoint: TOKEN_ENDPOINT })
            );

        await expect(
            beginAuthCodeFlow({
                offer: offerWithAuthCode,
                clientId: CLIENT_ID,
                redirectUri: REDIRECT_URI,
                fetchImpl: fetchMock as unknown as typeof fetch,
            })
        ).rejects.toMatchObject({ code: 'metadata_invalid' });
    });
});

describe('completeAuthCodeFlow', () => {
    beforeEach(() => {
        (fakeSigner.sign as jest.Mock).mockClear();
    });

    it('exchanges code → access_token → credential', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce(
                mockResponse({
                    access_token: 'at-1',
                    token_type: 'Bearer',
                    c_nonce: 'nonce-1',
                })
            )
            .mockResolvedValueOnce(mockResponse({ credential: 'eyJ.vc.jwt' }));

        const { flowHandle } = await (async () => {
            // Build a flowHandle by hand to skip the metadata dance.
            const pkce = await generatePkcePair();
            return {
                flowHandle: {
                    version: 1 as const,
                    issuer: ISSUER,
                    tokenEndpoint: TOKEN_ENDPOINT,
                    credentialEndpoint: CREDENTIAL_ENDPOINT,
                    configurationIds: ['UniversityDegree_jwt'],
                    redirectUri: REDIRECT_URI,
                    clientId: CLIENT_ID,
                    state: 'state-xxx',
                    pkceVerifier: pkce.verifier,
                    pkceMethod: 'S256' as const,
                    credentialConfigurations: {
                        UniversityDegree_jwt: {
                            format: 'jwt_vc_json',
                            credential_definition: { type: ['VerifiableCredential', 'UniversityDegree'] },
                        },
                    },
                },
            };
        })();

        const result = await completeAuthCodeFlow({
            flowHandle,
            code: 'callback-code',
            state: 'state-xxx',
            signer: fakeSigner,
            fetchImpl: fetchMock as unknown as typeof fetch,
        });

        expect(result.credentials).toHaveLength(1);
        expect(result.credentials[0]).toEqual({
            format: 'jwt_vc_json',
            credential: 'eyJ.vc.jwt',
            configuration_id: 'UniversityDegree_jwt',
        });

        expect(fakeSigner.sign).toHaveBeenCalledTimes(1);

        const tokenCall = fetchMock.mock.calls[0]!;
        const tokenBody = new URLSearchParams(tokenCall[1].body as string);
        expect(tokenBody.get('code')).toBe('callback-code');
        expect(tokenBody.get('code_verifier')).toBe(flowHandle.pkceVerifier);
    });

    it('rejects state mismatch between callback and flowHandle', async () => {
        const pkce = await generatePkcePair();
        const flowHandle = {
            version: 1 as const,
            issuer: ISSUER,
            tokenEndpoint: TOKEN_ENDPOINT,
            credentialEndpoint: CREDENTIAL_ENDPOINT,
            configurationIds: ['X'],
            redirectUri: REDIRECT_URI,
            clientId: CLIENT_ID,
            state: 'expected-state',
            pkceVerifier: pkce.verifier,
            pkceMethod: 'S256' as const,
            credentialConfigurations: {},
        };

        await expect(
            completeAuthCodeFlow({
                flowHandle,
                code: 'c',
                state: 'tampered-state',
                signer: fakeSigner,
            })
        ).rejects.toMatchObject({ code: 'token_request_failed' });
    });
});
