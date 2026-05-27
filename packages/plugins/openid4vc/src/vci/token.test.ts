import { exchangePreAuthorizedCode } from './token';
import { PRE_AUTHORIZED_CODE_GRANT } from '../offer/types';

const mockResponse = (body: unknown, init: { ok?: boolean; status?: number } = {}) =>
    ({
        ok: init.ok ?? true,
        status: init.status ?? 200,
        json: async () => body,
    } as unknown as Response);

describe('exchangePreAuthorizedCode', () => {
    it('POSTs the correct form body and returns the parsed token response', async () => {
        const fetchMock = jest.fn().mockResolvedValue(
            mockResponse({
                access_token: 'eyJ...',
                token_type: 'Bearer',
                expires_in: 3600,
                c_nonce: 'abc123',
                c_nonce_expires_in: 600,
            })
        );

        const result = await exchangePreAuthorizedCode({
            tokenEndpoint: 'https://issuer.example.com/token',
            preAuthorizedCode: 'code123',
            fetchImpl: fetchMock as unknown as typeof fetch,
        });

        expect(result.access_token).toBe('eyJ...');
        expect(result.c_nonce).toBe('abc123');

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://issuer.example.com/token');
        expect(init.method).toBe('POST');
        expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded');

        const parsed = new URLSearchParams(init.body as string);
        expect(parsed.get('grant_type')).toBe(PRE_AUTHORIZED_CODE_GRANT);
        expect(parsed.get('pre-authorized_code')).toBe('code123');
        expect(parsed.get('tx_code')).toBeNull();
        expect(parsed.get('client_id')).toBeNull();
    });

    it('includes tx_code when provided', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValue(mockResponse({ access_token: 'eyJ...', token_type: 'Bearer' }));

        await exchangePreAuthorizedCode({
            tokenEndpoint: 'https://issuer.example.com/token',
            preAuthorizedCode: 'code',
            txCode: '4321',
            fetchImpl: fetchMock as unknown as typeof fetch,
        });

        const parsed = new URLSearchParams(fetchMock.mock.calls[0][1].body);
        expect(parsed.get('tx_code')).toBe('4321');
    });

    it('includes client_id when provided', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValue(mockResponse({ access_token: 'eyJ...', token_type: 'Bearer' }));

        await exchangePreAuthorizedCode({
            tokenEndpoint: 'https://issuer.example.com/token',
            preAuthorizedCode: 'code',
            clientId: 'my-wallet',
            fetchImpl: fetchMock as unknown as typeof fetch,
        });

        const parsed = new URLSearchParams(fetchMock.mock.calls[0][1].body);
        expect(parsed.get('client_id')).toBe('my-wallet');
    });

    it('surfaces OAuth error body as token_request_failed', async () => {
        const fetchMock = jest.fn().mockResolvedValue(
            mockResponse(
                {
                    error: 'invalid_grant',
                    error_description: 'pre-authorized code expired',
                },
                { ok: false, status: 400 }
            )
        );

        await expect(
            exchangePreAuthorizedCode({
                tokenEndpoint: 'https://issuer.example.com/token',
                preAuthorizedCode: 'code',
                fetchImpl: fetchMock as unknown as typeof fetch,
            })
        ).rejects.toMatchObject({
            code: 'token_request_failed',
            status: 400,
            message: expect.stringContaining('invalid_grant'),
        });
    });

    it('throws token_response_invalid when access_token is missing', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValue(mockResponse({ token_type: 'Bearer' }));

        await expect(
            exchangePreAuthorizedCode({
                tokenEndpoint: 'https://issuer.example.com/token',
                preAuthorizedCode: 'code',
                fetchImpl: fetchMock as unknown as typeof fetch,
            })
        ).rejects.toMatchObject({ code: 'token_response_invalid' });
    });

    it('throws token_response_invalid when body is not JSON', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => {
                throw new Error('not json');
            },
        } as unknown as Response);

        await expect(
            exchangePreAuthorizedCode({
                tokenEndpoint: 'https://issuer.example.com/token',
                preAuthorizedCode: 'code',
                fetchImpl: fetchMock as unknown as typeof fetch,
            })
        ).rejects.toMatchObject({ code: 'token_response_invalid' });
    });

    it('throws token_request_failed on network error', async () => {
        const fetchMock = jest.fn().mockRejectedValue(new Error('connection refused'));

        await expect(
            exchangePreAuthorizedCode({
                tokenEndpoint: 'https://issuer.example.com/token',
                preAuthorizedCode: 'code',
                fetchImpl: fetchMock as unknown as typeof fetch,
            })
        ).rejects.toMatchObject({ code: 'token_request_failed' });
    });
});
