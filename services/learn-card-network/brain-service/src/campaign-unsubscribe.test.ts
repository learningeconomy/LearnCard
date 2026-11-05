import Fastify from 'fastify';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
const unsubscribe = vi.hoisted(() => vi.fn());
vi.mock('@helpers/campaign-unsubscribe.helpers', () => ({
    unsubscribeFromCampaignEmails: unsubscribe,
}));
import { campaignUnsubscribeFastifyPlugin } from './campaign-unsubscribe';
beforeEach(() => {
    unsubscribe.mockReset();
});
describe('one-click unsubscribe HTTP', () => {
    it('exposes the browser and provider routes through the deployed Lambda', () => {
        const config = parse(readFileSync(new URL('../serverless.yml', import.meta.url), 'utf8'));
        expect(config.functions.campaignUnsubscribe.handler).toBe(
            'lambda.campaignUnsubscribeHandler'
        );
        expect(config.functions.campaignUnsubscribe.events).toEqual(
            expect.arrayContaining([
                { httpApi: 'GET /campaigns/unsubscribe/browser' },
                { httpApi: 'POST /campaigns/unsubscribe/browser' },
                { httpApi: 'POST /campaigns/unsubscribe' },
            ])
        );
    });

    it.each([
        ['es-MX', 'es', 'ltr', 'Cancelar suscripción'],
        ['fr-FR', 'fr', 'ltr', 'Se désinscrire'],
        ['ar-EG', 'ar', 'rtl', 'إلغاء الاشتراك'],
    ])('localizes the browser page for %s', async (language, locale, direction, label) => {
        const app = Fastify();
        await app.register(campaignUnsubscribeFastifyPlugin);
        try {
            const page = await app.inject({
                url: '/campaigns/unsubscribe/browser?token=signed',
                headers: { 'accept-language': language },
            });
            expect(page.body).toContain(`lang="${locale}" dir="${direction}"`);
            expect(page.body).toContain(`${label}</button>`);
            expect(unsubscribe).not.toHaveBeenCalled();
        } finally {
            await app.close();
        }
    });

    it('serves an anonymous browser confirmation and applies only explicit form submissions', async () => {
        const app = Fastify();
        await app.register(campaignUnsubscribeFastifyPlugin);
        try {
            unsubscribe.mockResolvedValue(true);
            const page = await app.inject('/campaigns/unsubscribe/browser?token=signed');
            expect(page.statusCode).toBe(200);
            expect(page.headers['content-type']).toContain('text/html');
            expect(page.headers['cache-control']).toBe('no-store');
            expect(page.headers['referrer-policy']).toBe('no-referrer');
            expect(page.headers['content-security-policy']).toContain("form-action 'self'");
            expect(page.body).toContain('action="/campaigns/unsubscribe/browser"');
            expect(page.body).toContain('name="token" value="signed"');
            expect(page.body).toContain('Unsubscribe</button>');
            expect(unsubscribe).not.toHaveBeenCalled();
            const submitted = await app.inject({
                method: 'POST',
                url: '/campaigns/unsubscribe/browser',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                payload: 'token=signed',
            });
            expect(submitted.statusCode).toBe(200);
            expect(submitted.body).toContain('You’re unsubscribed');
            expect(submitted.body).not.toContain('signed');
            expect(unsubscribe).toHaveBeenCalledExactlyOnceWith('signed');
        } finally {
            await app.close();
        }
    });

    it('renders invalid and transient errors without leaking provider errors or unsafe markup', async () => {
        const app = Fastify();
        await app.register(campaignUnsubscribeFastifyPlugin);
        try {
            const attack = await app.inject(
                '/campaigns/unsubscribe/browser?token=%22%3E%3Cscript%3E'
            );
            expect(attack.statusCode).toBe(400);
            expect(attack.body).not.toContain('<script>');
            expect(unsubscribe).not.toHaveBeenCalled();
            for (const error of [
                new TRPCError({ code: 'BAD_REQUEST' }),
                new Error('private details'),
            ]) {
                unsubscribe.mockRejectedValueOnce(error);
                const response = await app.inject({
                    method: 'POST',
                    url: '/campaigns/unsubscribe/browser',
                    headers: { 'content-type': 'application/x-www-form-urlencoded' },
                    payload: 'token=signed',
                });
                expect(response.statusCode).toBe(error instanceof TRPCError ? 400 : 503);
                expect(response.body).toContain('role="alert"');
                expect(response.body).not.toContain('private details');
                expect(response.body.includes('Try Again')).toBe(!(error instanceof TRPCError));
            }
        } finally {
            await app.close();
        }
    });

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
