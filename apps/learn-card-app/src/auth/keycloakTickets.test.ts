import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('learn-card-base', () => ({
    networkStore: { get: { apiEndpoint: () => 'http://localhost:5100/trpc' } },
}));
vi.mock('../config/bootstrapTenantConfig', () => ({
    getTenantHeaders: () => ({ 'X-Tenant-Id': 'learncard' }),
}));
import { requestEmailOtpTicket, requestSocialTicket } from './keycloakTickets';

describe('ticket transport', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('posts email proof to the configured tRPC endpoint with tenant headers', async () => {
        const fetcher = vi
            .fn()
            .mockResolvedValue(
                new Response(
                    JSON.stringify({ result: { data: { success: true, ticket: 'ticket' } } })
                )
            );
        vi.stubGlobal('fetch', fetcher);
        await expect(requestEmailOtpTicket('dev-email@example.com', '123456')).resolves.toBe(
            'ticket'
        );
        expect(fetcher).toHaveBeenCalledWith(
            'http://localhost:5100/trpc/auth.requestLoginTicket',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': 'learncard' },
                body: JSON.stringify({ email: 'dev-email@example.com', code: '123456' }),
            })
        );
    });

    it.each(['google', 'apple'] as const)(
        'posts %s native proof to the social ticket route',
        async provider => {
            const fetcher = vi
                .fn()
                .mockResolvedValue(
                    new Response(
                        JSON.stringify({ result: { data: { success: true, ticket: 'ticket' } } })
                    )
                );
            vi.stubGlobal('fetch', fetcher);
            await requestSocialTicket(provider, 'id-token');
            expect(fetcher).toHaveBeenCalledWith(
                'http://localhost:5100/trpc/auth.requestSocialLoginTicket',
                expect.objectContaining({ body: JSON.stringify({ provider, idToken: 'id-token' }) })
            );
        }
    );

    it.each([{ success: false, error: 'internal details' }, { success: true }])(
        'rejects failed or missing tickets with friendly copy',
        async data => {
            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue(new Response(JSON.stringify({ result: { data } })))
            );
            await expect(requestEmailOtpTicket('dev-email@example.com', '123456')).rejects.toThrow(
                'Sign-in expired. Please try again.'
            );
        }
    );
});
