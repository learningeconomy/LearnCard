import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    resilientAcceptAndStoreCredentialOffer,
    resilientCompleteCredentialOfferAuthCode,
} from './resilientVci';

const { runWithRecoveryMock, buildSignerForStrategyMock, getApplicableSignerStrategiesMock } =
    vi.hoisted(() => ({
        runWithRecoveryMock: vi.fn(),
        buildSignerForStrategyMock: vi.fn(),
        getApplicableSignerStrategiesMock: vi.fn(),
    }));

vi.mock('learn-card-base', () => ({
    runWithRecovery: runWithRecoveryMock,
}));

vi.mock('@learncard/openid4vc-plugin', () => ({
    storeAcceptedCredentials: vi.fn(),
}));

vi.mock('./signerStrategies', () => ({
    buildSignerForStrategy: buildSignerForStrategyMock,
    getApplicableSignerStrategies: getApplicableSignerStrategiesMock,
}));

describe('resilientCompleteCredentialOfferAuthCode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not re-exchange the auth code when signer fallback retries the credential request', async () => {
        const tokenResponse = {
            access_token: 'at-123',
            token_type: 'Bearer',
            c_nonce: 'nonce-123',
        };
        const expectedResult = {
            credentials: [
                {
                    format: 'jwt_vc_json',
                    credential: 'eyJ.vc.jwt',
                    configuration_id: 'UniversityDegree_jwt',
                },
            ],
        };
        const flowHandle = {
            version: 1 as const,
            issuer: 'https://issuer.example.com',
            tokenEndpoint: 'https://issuer.example.com/token',
            credentialEndpoint: 'https://issuer.example.com/credential',
            configurationIds: ['UniversityDegree_jwt'],
            redirectUri: 'http://127.0.0.1:54321/cb',
            clientId: 'wallet-client-id',
            state: 'callback-state',
            pkceVerifier: 'pkce-verifier',
            pkceMethod: 'S256' as const,
            credentialConfigurations: {},
        };

        const wallet = {
            invoke: {
                exchangeAuthCodeForToken: vi.fn().mockResolvedValue(tokenResponse),
                requestCredentialsFromAuthCodeToken: vi
                    .fn()
                    .mockRejectedValueOnce({
                        code: 'credential_request_failed',
                        body: { error: 'invalid_credential_request' },
                    })
                    .mockResolvedValueOnce(expectedResult),
            },
            id: {
                did: vi.fn(),
                keypair: vi.fn(),
            },
        };

        getApplicableSignerStrategiesMock.mockReturnValue(['did:web', 'did:key']);
        buildSignerForStrategyMock
            .mockResolvedValueOnce({ alg: 'EdDSA', kid: 'did:web:holder#0', sign: vi.fn() })
            .mockResolvedValueOnce({ alg: 'EdDSA', kid: 'did:key:holder#0', sign: vi.fn() });

        runWithRecoveryMock.mockImplementation(async operation => {
            try {
                await operation({ strategy: { axis: 'signer', id: 'did:web' } });
            } catch {
                return operation({ strategy: { axis: 'signer', id: 'did:key' } });
            }

            throw new Error('expected first attempt to fail');
        });

        const result = await resilientCompleteCredentialOfferAuthCode({
            wallet,
            flowHandle,
            code: 'callback-code',
            state: 'callback-state',
        });

        expect(result).toEqual(expectedResult);
        expect(wallet.invoke.exchangeAuthCodeForToken).toHaveBeenCalledTimes(1);
        expect(wallet.invoke.exchangeAuthCodeForToken).toHaveBeenCalledWith({
            flowHandle,
            code: 'callback-code',
            state: 'callback-state',
        });
        expect(wallet.invoke.requestCredentialsFromAuthCodeToken).toHaveBeenCalledTimes(2);
        expect(wallet.invoke.requestCredentialsFromAuthCodeToken).toHaveBeenNthCalledWith(1, {
            flowHandle,
            tokenResponse,
            signer: expect.objectContaining({ kid: 'did:web:holder#0' }),
        });
        expect(wallet.invoke.requestCredentialsFromAuthCodeToken).toHaveBeenNthCalledWith(2, {
            flowHandle,
            tokenResponse,
            signer: expect.objectContaining({ kid: 'did:key:holder#0' }),
        });
    });

    it('does not exchange the auth code when the first signer build fails before any request', async () => {
        const flowHandle = {
            version: 1 as const,
            issuer: 'https://issuer.example.com',
            tokenEndpoint: 'https://issuer.example.com/token',
            credentialEndpoint: 'https://issuer.example.com/credential',
            configurationIds: ['UniversityDegree_jwt'],
            redirectUri: 'http://127.0.0.1:54321/cb',
            clientId: 'wallet-client-id',
            state: 'callback-state',
            pkceVerifier: 'pkce-verifier',
            pkceMethod: 'S256' as const,
            credentialConfigurations: {},
        };

        const wallet = {
            invoke: {
                exchangeAuthCodeForToken: vi.fn(),
                requestCredentialsFromAuthCodeToken: vi.fn(),
            },
            id: { did: vi.fn(), keypair: vi.fn() },
        };

        getApplicableSignerStrategiesMock.mockReturnValue(['did:web', 'did:key']);
        buildSignerForStrategyMock.mockRejectedValue(new Error('local signer setup failed'));

        runWithRecoveryMock.mockImplementation(async operation =>
            operation({ strategy: { axis: 'signer', id: 'did:web' } })
        );

        await expect(
            resilientCompleteCredentialOfferAuthCode({
                wallet,
                flowHandle,
                code: 'callback-code',
                state: 'callback-state',
            })
        ).rejects.toThrow('local signer setup failed');

        expect(wallet.invoke.exchangeAuthCodeForToken).not.toHaveBeenCalled();
        expect(wallet.invoke.requestCredentialsFromAuthCodeToken).not.toHaveBeenCalled();
    });
});

describe('resilientAcceptAndStoreCredentialOffer (pre-auth split)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not re-exchange the pre-auth code when signer fallback retries the credential request', async () => {
        const tokenResponse = {
            access_token: 'preauth-token-456',
            token_type: 'Bearer',
            c_nonce: 'preauth-nonce-456',
        };
        const acceptedResult = {
            credentials: [
                {
                    format: 'dc+sd-jwt',
                    credential: 'eyJ.preauth.sdjwt~disclosure~',
                    configuration_id: 'PidSdJwtVc',
                },
            ],
        };
        const storedResult = {
            stored: [
                {
                    uri: 'lc://stored/preauth-credential-1',
                    format: 'dc+sd-jwt' as const,
                },
            ],
            failures: [],
        };
        const offer = 'openid-credential-offer://?credential_offer=%7B%7D';
        const options = { confirmationCode: 'tx-789' };

        const wallet = {
            invoke: {
                exchangePreAuthCodeForToken: vi.fn().mockResolvedValue(tokenResponse),
                requestCredentialsFromPreAuthToken: vi
                    .fn()
                    .mockRejectedValueOnce({
                        code: 'credential_request_failed',
                        body: { error: 'invalid_credential_request' },
                    })
                    .mockResolvedValueOnce(acceptedResult),
            },
            id: {
                did: vi.fn(),
                keypair: vi.fn(),
            },
        };

        getApplicableSignerStrategiesMock.mockReturnValue(['did:web', 'did:key']);
        buildSignerForStrategyMock
            .mockResolvedValueOnce({ alg: 'EdDSA', kid: 'did:web:holder#0', sign: vi.fn() })
            .mockResolvedValueOnce({ alg: 'EdDSA', kid: 'did:key:holder#0', sign: vi.fn() });

        runWithRecoveryMock.mockImplementation(async operation => {
            try {
                await operation({ strategy: { axis: 'signer', id: 'did:web' } });
            } catch {
                return operation({ strategy: { axis: 'signer', id: 'did:key' } });
            }
            throw new Error('expected first attempt to fail');
        });

        const { storeAcceptedCredentials } = await import('@learncard/openid4vc-plugin');
        (storeAcceptedCredentials as ReturnType<typeof vi.fn>).mockResolvedValue(storedResult);

        const result = await resilientAcceptAndStoreCredentialOffer({
            wallet,
            offer,
            options,
        });

        expect(result).toEqual({ ...acceptedResult, ...storedResult });
        expect(wallet.invoke.exchangePreAuthCodeForToken).toHaveBeenCalledTimes(1);
        expect(wallet.invoke.exchangePreAuthCodeForToken).toHaveBeenCalledWith(offer, options);
        expect(wallet.invoke.requestCredentialsFromPreAuthToken).toHaveBeenCalledTimes(2);
        expect(wallet.invoke.requestCredentialsFromPreAuthToken).toHaveBeenNthCalledWith(1, {
            input: offer,
            tokenResponse,
            options,
            signer: expect.objectContaining({ kid: 'did:web:holder#0' }),
        });
        expect(wallet.invoke.requestCredentialsFromPreAuthToken).toHaveBeenNthCalledWith(2, {
            input: offer,
            tokenResponse,
            options,
            signer: expect.objectContaining({ kid: 'did:key:holder#0' }),
        });
    });
});
