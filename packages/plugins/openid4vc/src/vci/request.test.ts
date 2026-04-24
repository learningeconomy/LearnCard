import { requestCredential } from './request';

const mockResponse = (body: unknown, init: { ok?: boolean; status?: number } = {}) =>
    ({
        ok: init.ok ?? true,
        status: init.status ?? 200,
        json: async () => body,
    } as unknown as Response);

describe('requestCredential', () => {
    it('sends the proof JWT + format + Authorization header (format-based path)', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValue(mockResponse({ credential: 'eyJ.vc.jwt', c_nonce: 'new-nonce' }));

        const result = await requestCredential({
            credentialEndpoint: 'https://issuer.example.com/credential',
            accessToken: 'token-abc',
            format: 'jwt_vc_json',
            proofJwt: 'eyJ.proof.sig',
            fetchImpl: fetchMock as unknown as typeof fetch,
        });

        expect(result.credential).toBe('eyJ.vc.jwt');
        expect(result.c_nonce).toBe('new-nonce');

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://issuer.example.com/credential');
        expect(init.method).toBe('POST');
        expect(init.headers['Authorization']).toBe('Bearer token-abc');
        expect(init.headers['Content-Type']).toBe('application/json');

        const body = JSON.parse(init.body);
        expect(body.format).toBe('jwt_vc_json');
        expect(body.proof).toEqual({ proof_type: 'jwt', jwt: 'eyJ.proof.sig' });
        // Regression: Draft 13 §7.2 forbids pairing `credential_identifier`
        // with `format`, and we never had a real identifier here anyway.
        expect(body.credential_identifier).toBeUndefined();
    });

    it('sends credential_identifier (and NOT format) when caller supplies one from authorization_details', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValue(mockResponse({ credential: 'eyJ.vc.jwt' }));

        await requestCredential({
            credentialEndpoint: 'https://issuer.example.com/credential',
            accessToken: 'token-abc',
            credentialIdentifier: 'auth-details-id-abc',
            // Even if the caller accidentally supplies these, the spec
            // (§7.2) says they MUST NOT be sent alongside credential_identifier.
            format: 'jwt_vc_json',
            extra: { credential_definition: { type: ['X'] } },
            proofJwt: 'eyJ.proof.sig',
            fetchImpl: fetchMock as unknown as typeof fetch,
        });

        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body.credential_identifier).toBe('auth-details-id-abc');
        expect(body.format).toBeUndefined();
        expect(body.credential_definition).toBeUndefined();
    });

    it('throws when neither credentialIdentifier nor format is supplied', async () => {
        await expect(
            requestCredential({
                credentialEndpoint: 'https://issuer.example.com/credential',
                accessToken: 'token-abc',
                proofJwt: 'eyJ.proof.sig',
                fetchImpl: jest.fn() as unknown as typeof fetch,
            })
        ).rejects.toMatchObject({
            code: 'credential_request_failed',
            message: expect.stringContaining('credentialIdentifier'),
        });
    });

    it('uses the supplied token_type verbatim in the Authorization header', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValue(mockResponse({ credential: 'eyJ.vc.jwt' }));

        await requestCredential({
            credentialEndpoint: 'https://issuer.example.com/credential',
            accessToken: 'token-abc',
            tokenType: 'DPoP',
            format: 'jwt_vc_json',
            proofJwt: 'eyJ.proof.sig',
            fetchImpl: fetchMock as unknown as typeof fetch,
        });

        expect(fetchMock.mock.calls[0][1].headers['Authorization']).toBe('DPoP token-abc');
    });

    it('merges caller-supplied extra body fields', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValue(mockResponse({ credential: 'eyJ.vc.jwt' }));

        await requestCredential({
            credentialEndpoint: 'https://issuer.example.com/credential',
            accessToken: 'token',
            format: 'jwt_vc_json',
            proofJwt: 'eyJ.proof.sig',
            extra: { credential_definition: { type: ['VerifiableCredential', 'UniversityDegree'] } },
            fetchImpl: fetchMock as unknown as typeof fetch,
        });

        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body.credential_definition).toEqual({
            type: ['VerifiableCredential', 'UniversityDegree'],
        });
    });

    it('surfaces OAuth error body as credential_request_failed', async () => {
        const fetchMock = jest.fn().mockResolvedValue(
            mockResponse(
                { error: 'invalid_proof', error_description: 'nonce mismatch' },
                { ok: false, status: 400 }
            )
        );

        await expect(
            requestCredential({
                credentialEndpoint: 'https://issuer.example.com/credential',
                accessToken: 'token',
                format: 'jwt_vc_json',
                proofJwt: 'eyJ.proof.sig',
                fetchImpl: fetchMock as unknown as typeof fetch,
            })
        ).rejects.toMatchObject({
            code: 'credential_request_failed',
            status: 400,
            message: expect.stringContaining('invalid_proof'),
        });
    });

    it('throws credential_request_failed on network error', async () => {
        const fetchMock = jest.fn().mockRejectedValue(new Error('timeout'));

        await expect(
            requestCredential({
                credentialEndpoint: 'https://issuer.example.com/credential',
                accessToken: 'token',
                format: 'jwt_vc_json',
                proofJwt: 'eyJ.proof.sig',
                fetchImpl: fetchMock as unknown as typeof fetch,
            })
        ).rejects.toMatchObject({ code: 'credential_request_failed' });
    });

    it('throws credential_response_invalid on non-JSON body', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => {
                throw new Error('not json');
            },
        } as unknown as Response);

        await expect(
            requestCredential({
                credentialEndpoint: 'https://issuer.example.com/credential',
                accessToken: 'token',
                format: 'jwt_vc_json',
                proofJwt: 'eyJ.proof.sig',
                fetchImpl: fetchMock as unknown as typeof fetch,
            })
        ).rejects.toMatchObject({ code: 'credential_response_invalid' });
    });
});
