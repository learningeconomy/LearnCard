import { fetchNonceFromEndpoint } from './nonce';

const mockResponse = (
    body: unknown,
    init: { ok?: boolean; status?: number; text?: string; jsonError?: Error } = {}
) =>
    ({
        ok: init.ok ?? true,
        status: init.status ?? 200,
        json: async () => {
            if (init.jsonError) throw init.jsonError;
            return body;
        },
        text: async () => init.text ?? (typeof body === 'string' ? body : JSON.stringify(body)),
    } as unknown as Response);

describe('fetchNonceFromEndpoint', () => {
    it('POSTs an empty body and returns c_nonce + expiry', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValue(mockResponse({ c_nonce: 'nonce-123', c_nonce_expires_in: 86400 }));

        const result = await fetchNonceFromEndpoint(
            'https://issuer.example.com/nonce',
            fetchMock as unknown as typeof fetch
        );

        expect(result).toEqual({ c_nonce: 'nonce-123', c_nonce_expires_in: 86400 });
        expect(fetchMock).toHaveBeenCalledWith('https://issuer.example.com/nonce', {
            method: 'POST',
        });
        expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
    });

    it('returns undefined expiry when c_nonce_expires_in is omitted', async () => {
        const fetchMock = jest.fn().mockResolvedValue(mockResponse({ c_nonce: 'nonce-123' }));

        const result = await fetchNonceFromEndpoint(
            'https://issuer.example.com/nonce',
            fetchMock as unknown as typeof fetch
        );

        expect(result).toEqual({ c_nonce: 'nonce-123', c_nonce_expires_in: undefined });
    });

    it('throws on non-200 response', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValue(
                mockResponse('bad nonce', { ok: false, status: 500, text: 'bad nonce' })
            );

        await expect(
            fetchNonceFromEndpoint(
                'https://issuer.example.com/nonce',
                fetchMock as unknown as typeof fetch
            )
        ).rejects.toMatchObject({
            code: 'credential_request_failed',
            status: 500,
        });
    });

    it('throws on non-JSON response', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValue(mockResponse(undefined, { jsonError: new Error('not json') }));

        await expect(
            fetchNonceFromEndpoint(
                'https://issuer.example.com/nonce',
                fetchMock as unknown as typeof fetch
            )
        ).rejects.toMatchObject({ code: 'credential_response_invalid' });
    });

    it('throws when c_nonce is missing', async () => {
        const fetchMock = jest.fn().mockResolvedValue(mockResponse({ c_nonce_expires_in: 600 }));

        await expect(
            fetchNonceFromEndpoint(
                'https://issuer.example.com/nonce',
                fetchMock as unknown as typeof fetch
            )
        ).rejects.toMatchObject({ code: 'credential_response_invalid' });
    });
});
