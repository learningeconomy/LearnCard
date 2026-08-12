import {
    fetchAuthorizationServerMetadata,
    fetchCredentialIssuerMetadata,
    resolveAuthorizationServer,
} from './metadata';
import { VciError } from './errors';

const mockResponse = (
    body: unknown,
    init: { ok?: boolean; status?: number; statusText?: string } = {}
) =>
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
            { method: 'GET', headers: { Accept: 'application/json' } }
        );
        expect(result.metadata.credential_issuer).toBe('https://issuer.example.com');
        expect(result.metadata.credential_endpoint).toBe('https://issuer.example.com/credential');
        expect(result.specVersion).toBe('final');
    });

    it('strips trailing slash from issuer URL before inserting well-known path', async () => {
        const fetchMock = jest.fn().mockResolvedValue(mockResponse(validMetadata));

        await fetchCredentialIssuerMetadata(
            'https://issuer.example.com/',
            fetchMock as unknown as typeof fetch
        );

        expect(fetchMock).toHaveBeenCalledWith(
            'https://issuer.example.com/.well-known/openid-credential-issuer',
            { method: 'GET', headers: { Accept: 'application/json' } }
        );
    });

    it('inserts well-known between host and path for a path-bearing issuer (OID4VCI 1.0 Final §12.2.2)', async () => {
        const tenantMetadata = {
            ...validMetadata,
            credential_issuer: 'https://issuer.example.com/tenant',
            credential_endpoint: 'https://issuer.example.com/tenant/credential',
        };
        const fetchMock = jest.fn().mockResolvedValue(mockResponse(tenantMetadata));

        await fetchCredentialIssuerMetadata(
            'https://issuer.example.com/tenant',
            fetchMock as unknown as typeof fetch
        );

        expect(fetchMock).toHaveBeenCalledWith(
            'https://issuer.example.com/.well-known/openid-credential-issuer/tenant',
            { method: 'GET', headers: { Accept: 'application/json' } }
        );
    });

    it('inserts well-known for a deep multi-segment issuer path', async () => {
        const deepMetadata = {
            ...validMetadata,
            credential_issuer: 'https://transactions.example.com/workflows/claim/exchanges/abc-123',
            credential_endpoint:
                'https://transactions.example.com/workflows/claim/exchanges/abc-123/credential',
        };
        const fetchMock = jest.fn().mockResolvedValue(mockResponse(deepMetadata));

        await fetchCredentialIssuerMetadata(
            'https://transactions.example.com/workflows/claim/exchanges/abc-123',
            fetchMock as unknown as typeof fetch
        );

        expect(fetchMock).toHaveBeenCalledWith(
            'https://transactions.example.com/.well-known/openid-credential-issuer/workflows/claim/exchanges/abc-123',
            { method: 'GET', headers: { Accept: 'application/json' } }
        );
    });

    it('[draft-13-compat] falls back to the append-style URL and reports specVersion draft-13', async () => {
        const draft13Metadata = {
            ...validMetadata,
            credential_issuer: 'https://issuer.example.com/draft13',
            credential_endpoint: 'https://issuer.example.com/draft13/credential',
        };
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce(
                mockResponse({}, { ok: false, status: 404, statusText: 'Not Found' })
            )
            .mockResolvedValueOnce(mockResponse(draft13Metadata));

        const result = await fetchCredentialIssuerMetadata(
            'https://issuer.example.com/draft13',
            fetchMock as unknown as typeof fetch
        );

        expect(result.specVersion).toBe('draft-13');
        expect(fetchMock).toHaveBeenNthCalledWith(
            1,
            'https://issuer.example.com/.well-known/openid-credential-issuer/draft13',
            { method: 'GET', headers: { Accept: 'application/json' } }
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            'https://issuer.example.com/draft13/.well-known/openid-credential-issuer',
            { method: 'GET', headers: { Accept: 'application/json' } }
        );
    });

    it('does not fall back for a path-less issuer (insert === append)', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValue(
                mockResponse({}, { ok: false, status: 404, statusText: 'Not Found' })
            );

        await expect(
            fetchCredentialIssuerMetadata(
                'https://issuer.example.com',
                fetchMock as unknown as typeof fetch
            )
        ).rejects.toMatchObject({ code: 'metadata_fetch_failed', status: 404 });

        expect(fetchMock).toHaveBeenCalledTimes(1);
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

    it('tolerates trailing-slash / scheme-case differences in issuer identifier comparison', async () => {
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
            .mockResolvedValue(
                mockResponse({}, { ok: false, status: 404, statusText: 'Not Found' })
            );

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
            { method: 'GET', headers: { Accept: 'application/json' } }
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
            { method: 'GET', headers: { Accept: 'application/json' } }
        );
        expect(result.token_endpoint).toBe('https://issuer.example.com/token');
    });

    it('inserts oauth-authorization-server well-known between host and path (RFC 8414 §3)', async () => {
        const fetchMock = jest.fn().mockResolvedValue(mockResponse(validAsMetadata));

        await fetchAuthorizationServerMetadata(
            'https://issuer.example.com/tenant',
            fetchMock as unknown as typeof fetch
        );

        expect(fetchMock).toHaveBeenCalledWith(
            'https://issuer.example.com/.well-known/oauth-authorization-server/tenant',
            { method: 'GET', headers: { Accept: 'application/json' } }
        );
    });

    it('appends openid-configuration to the path on fallback (OIDC Discovery style)', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce(mockResponse({}, { ok: false, status: 404 }))
            .mockResolvedValueOnce(mockResponse(validAsMetadata));

        await fetchAuthorizationServerMetadata(
            'https://issuer.example.com/tenant',
            fetchMock as unknown as typeof fetch
        );

        expect(fetchMock).toHaveBeenNthCalledWith(
            1,
            'https://issuer.example.com/.well-known/oauth-authorization-server/tenant',
            { method: 'GET', headers: { Accept: 'application/json' } }
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            'https://issuer.example.com/tenant/.well-known/openid-configuration',
            { method: 'GET', headers: { Accept: 'application/json' } }
        );
    });

    it('[draft-13-compat] falls back to append-style oauth-authorization-server when insert + openid-configuration 404', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce(mockResponse({}, { ok: false, status: 404 }))
            .mockResolvedValueOnce(mockResponse({}, { ok: false, status: 404 }))
            .mockResolvedValueOnce(mockResponse(validAsMetadata));

        const result = await fetchAuthorizationServerMetadata(
            'https://issuer.example.com/embedded/issuer',
            fetchMock as unknown as typeof fetch
        );

        expect(result.token_endpoint).toBe('https://issuer.example.com/token');
        expect(fetchMock).toHaveBeenNthCalledWith(
            1,
            'https://issuer.example.com/.well-known/oauth-authorization-server/embedded/issuer',
            { method: 'GET', headers: { Accept: 'application/json' } }
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            'https://issuer.example.com/embedded/issuer/.well-known/openid-configuration',
            { method: 'GET', headers: { Accept: 'application/json' } }
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
            3,
            'https://issuer.example.com/embedded/issuer/.well-known/oauth-authorization-server',
            { method: 'GET', headers: { Accept: 'application/json' } }
        );
    });

    it('throws metadata_fetch_failed when both well-known paths fail', async () => {
        const fetchMock = jest.fn().mockResolvedValue(mockResponse({}, { ok: false, status: 404 }));

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
