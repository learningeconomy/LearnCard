import Fastify from 'fastify';
import { describe, expect, it, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
const unsubscribe = vi.hoisted(() => vi.fn());
vi.mock('@helpers/campaign-unsubscribe.helpers', () => ({
    unsubscribeFromCampaignEmails: unsubscribe,
}));
import { campaignUnsubscribeFastifyPlugin } from './campaign-unsubscribe';
describe('one-click unsubscribe HTTP', () => {
    it('handles actual form POSTs without auth and does not mutate on GET', async () => {
        const app = Fastify();
        await app.register(campaignUnsubscribeFastifyPlugin);
        try {
            unsubscribe.mockResolvedValue(true);
            const response = await app.inject({
                method: 'POST',
                url: '/campaigns/unsubscribe?token=signed',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                payload: 'List-Unsubscribe=One-Click',
            });
            expect(response.statusCode).toBe(200);
            expect(response.headers['cache-control']).toBe('no-store');
            expect(unsubscribe).toHaveBeenCalledWith('signed');
            unsubscribe.mockClear();
            expect(
                (await app.inject({ method: 'GET', url: '/campaigns/unsubscribe?token=signed' }))
                    .statusCode
            ).toBe(404);
            expect(
                (
                    await app.inject({
                        method: 'POST',
                        url: '/campaigns/unsubscribe?token=signed',
                        headers: { 'content-type': 'application/x-www-form-urlencoded' },
                        payload: 'other=value',
                    })
                ).statusCode
            ).toBe(400);
            expect(unsubscribe).not.toHaveBeenCalled();
            unsubscribe.mockRejectedValue(new TRPCError({ code: 'BAD_REQUEST' }));
            expect(
                (
                    await app.inject({
                        method: 'POST',
                        url: '/campaigns/unsubscribe?token=tampered',
                        headers: { 'content-type': 'application/x-www-form-urlencoded' },
                        payload: 'List-Unsubscribe=One-Click',
                    })
                ).statusCode
            ).toBe(400);
        } finally {
            await app.close();
        }
    });
});
