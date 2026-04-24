import {
    fetchAuthorizationServerMetadata,
    fetchCredentialIssuerMetadata,
    resolveAuthorizationServer,
} from './metadata';
import { VciError } from './errors';

const mockResponse = (body: unknown, init: { ok?: boolean; status?: number; statusText?: string } = {}) =>
    ({
        ok: init.ok ?? true,
        status: init.status ?? 200,
        statusText: init.statusText ?? 'OK',
        json: async () => body,
    } as unknown as Response);

describe('fetchCredentialIssuerMetadata', () => {
    const validMetadata = {
        credential_issuer: 'https://issuer.example.com',
        credential_endpoint: 'https://issuer.example.com/credential',
        credential_configurations_supported: {
            UniversityDegree_jwt_vc_json: { format: 'jwt_vc_json' },
        },
    };

    it('fetches issuer metadata from the well-known endpoint', async () => {
        const fetchMock = jest.fn().mockResolvedValue(mockResponse(validMetadata));

        const result = await fetchCredentialIssuerMetadata(
            'https://issuer.example.com',
            fetchMock as unknown as typeof fetch
        );

        expect(fetchMock).toHaveBeenCalledWith(
            'https://issuer.example.com/.well-known/openid-credential-issuer',
            { method: 'GET' }
        );
        expect(result.credential_issuer).toBe('https://issuer.example.com');
        expect(result.credential_endpoint).toBe('https://issuer.example.com/credential');
    });

    it('strips trailing slash from issuer URL before appending well-known path', async () => {
        const fetchMock = jest.fn().mockResolvedValue(mockResponse(validMetadata));

        await fetchCredentialIssuerMetadata(
            'https://issuer.example.com/',
            fetchMock as unknown as typeof fetch
        );

        expect(fetchMock).toHaveBeenCalledWith(
            'https://issuer.example.com/.well-known/openid-credential-issuer',
            { method: 'GET' }
        );
    });

    it('throws metadata_issuer_mismatch when advertised issuer differs', async () => {
        const mismatched = { ...validMetadata, credential_issuer: 'https://other.example.com' };
        const fetchMock = jest.fn().mockResolvedValue(mockResponse(mismatched));

        await expect(
            fetchCredentialIssuerMetadata(
                'https://issuer.example.com',
                fetchMock as unknown as typeof fetch
            )
        ).rejects.toMatchObject({ code: 'metadata_issuer_mismatch' });
    });

    it('tolerates trailing-slash / case differences in origin comparison', async () => {
        const withSlash = { ...validMetadata, credential_issuer: 'https://issuer.example.com/' };
        const fetchMock = jest.fn().mockResolvedValue(mockResponse(withSlash));

        await expect(
            fetchCredentialIssuerMetadata(
                'https://issuer.example.com',
                fetchMock as unknown as typeof fetch
            )
        ).resolves.toBeDefined();
    });

    it('throws metadata_invalid when credential_endpoint is missing', async () => {
        const bad = { credential_issuer: 'https://issuer.example.com' };
        const fetchMock = jest.fn().mockResolvedValue(mockResponse(bad));

        await expect(
            fetchCredentialIssuerMetadata(
                'https://issuer.example.com',
                fetchMock as unknown as typeof fetch
            )
        ).rejects.toMatchObject({ code: 'metadata_invalid' });
    });

    it('throws metadata_invalid when credential_issuer is missing', async () => {
        const bad = { credential_endpoint: 'https://issuer.example.com/credential' };
        const fetchMock = jest.fn().mockResolvedValue(mockResponse(bad));

        await expect(
            fetchCredentialIssuerMetadata(
                'https://issuer.example.com',
                fetchMock as unknown as typeof fetch
            )
        ).rejects.toMatchObject({ code: 'metadata_invalid' });
    });

    it('throws metadata_fetch_failed on HTTP 404', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValue(mockResponse({}, { ok: false, status: 404, statusText: 'Not Found' }));

        await expect(
            fetchCredentialIssuerMetadata(
                'https://issuer.example.com',
                fetchMock as unknown as typeof fetch
            )
        ).rejects.toMatchObject({ code: 'metadata_fetch_failed', status: 404 });
    });

    it('throws metadata_fetch_failed on network error', async () => {
        const fetchMock = jest.fn().mockRejectedValue(new Error('ENOTFOUND'));

        await expect(
            fetchCredentialIssuerMetadata(
                'https://issuer.example.com',
                fetchMock as unknown as typeof fetch
            )
        ).rejects.toBeInstanceOf(VciError);
    });
});

describe('fetchAuthorizationServerMetadata', () => {
    const validAsMetadata = {
        issuer: 'https://issuer.example.com',
        token_endpoint: 'https://issuer.example.com/token',
        authorization_endpoint: 'https://issuer.example.com/authorize',
    };

    it('fetches from oauth-authorization-server well-known path first', async () => {
        const fetchMock = jest.fn().mockResolvedValue(mockResponse(validAsMetadata));

        const result = await fetchAuthorizationServerMetadata(
            'https://issuer.example.com',
            fetchMock as unknown as typeof fetch
        );

        expect(fetchMock).toHaveBeenCalledWith(
            'https://issuer.example.com/.well-known/oauth-authorization-server',
            { method: 'GET' }
        );
        expect(result.token_endpoint).toBe('https://issuer.example.com/token');
    });

    it('falls back to openid-configuration when oauth path 404s', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce(mockResponse({}, { ok: false, status: 404 }))
            .mockResolvedValueOnce(mockResponse(validAsMetadata));

        const result = await fetchAuthorizationServerMetadata(
            'https://issuer.example.com',
            fetchMock as unknown as typeof fetch
        );

        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            'https://issuer.example.com/.well-known/openid-configuration',
            { method: 'GET' }
        );
        expect(result.token_endpoint).toBe('https://issuer.example.com/token');
    });

    it('throws metadata_fetch_failed when both well-known paths fail', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValue(mockResponse({}, { ok: false, status: 404 }));

        await expect(
            fetchAuthorizationServerMetadata(
                'https://issuer.example.com',
                fetchMock as unknown as typeof fetch
            )
        ).rejects.toMatchObject({ code: 'metadata_fetch_failed' });
    });

    it('throws metadata_invalid when token_endpoint is missing', async () => {
        const bad = { issuer: 'https://issuer.example.com' };
        const fetchMock = jest.fn().mockResolvedValue(mockResponse(bad));

        await expect(
            fetchAuthorizationServerMetadata(
                'https://issuer.example.com',
                fetchMock as unknown as typeof fetch
            )
        ).rejects.toMatchObject({ code: 'metadata_invalid' });
    });
});

describe('resolveAuthorizationServer', () => {
    const issuerMeta = {
        credential_issuer: 'https://issuer.example.com',
        credential_endpoint: 'https://issuer.example.com/credential',
    };

    it('prefers the grant-scoped authorization_server when present', () => {
        expect(
            resolveAuthorizationServer(
                {
                    ...issuerMeta,
                    authorization_servers: ['https://as1.example.com', 'https://as2.example.com'],
                },
                'https://grant-as.example.com'
            )
        ).toBe('https://grant-as.example.com');
    });

    it('falls back to the first entry of authorization_servers', () => {
        expect(
            resolveAuthorizationServer({
                ...issuerMeta,
                authorization_servers: ['https://as1.example.com', 'https://as2.example.com'],
            })
        ).toBe('https://as1.example.com');
    });

    it('falls back to the issuer itself when neither is specified', () => {
        expect(resolveAuthorizationServer(issuerMeta)).toBe('https://issuer.example.com');
    });
});
