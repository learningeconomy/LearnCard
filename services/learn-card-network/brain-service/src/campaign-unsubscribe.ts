import Fastify, { type FastifyPluginAsync } from 'fastify';
import { TRPCError } from '@trpc/server';
import { unsubscribeFromCampaignEmails } from '@helpers/campaign-unsubscribe.helpers';
import { renderCampaignUnsubscribePage } from '@helpers/campaign-unsubscribe-page';

/** RFC 8058 endpoint: form POSTs work without cookies, redirects, or a JavaScript client. */
export const campaignUnsubscribeFastifyPlugin: FastifyPluginAsync = async app => {
    app.addContentTypeParser(
        'application/x-www-form-urlencoded',
        { parseAs: 'string', bodyLimit: 1024 },
        (_request, body, done) => {
            done(null, new URLSearchParams(String(body)));
        }
    );
    app.route<{ Querystring: { token?: string } }>({
        method: ['GET', 'POST'],
        url: '/campaigns/unsubscribe/browser',
        bodyLimit: 4096,
        logLevel: 'silent',
        handler: async (request, reply) => {
            const language = request.headers['accept-language'];
            reply
                .type('text/html; charset=utf-8')
                .header('Cache-Control', 'no-store')
                .header('Referrer-Policy', 'no-referrer')
                .header('X-Content-Type-Options', 'nosniff')
                .header(
                    'Content-Security-Policy',
                    "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"
                );
            const token =
                request.method === 'GET'
                    ? request.query.token
                    : request.body instanceof URLSearchParams
                      ? request.body.get('token')
                      : undefined;
            if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{1,2048}$/.test(token))
                return reply
                    .code(400)
                    .send(renderCampaignUnsubscribePage('invalid', undefined, language));
            if (request.method === 'GET')
                return reply.send(renderCampaignUnsubscribePage('confirm', token, language));
            try {
                await unsubscribeFromCampaignEmails(token);
                return reply.send(renderCampaignUnsubscribePage('success', undefined, language));
            } catch (error) {
                const invalid = error instanceof TRPCError && error.code === 'BAD_REQUEST';
                return reply
                    .code(invalid ? 400 : 503)
                    .send(
                        renderCampaignUnsubscribePage(
                            invalid ? 'invalid' : 'error',
                            invalid ? undefined : token,
                            language
                        )
                    );
            }
        },
    });
    app.post<{ Querystring: { token?: string } }>(
        '/campaigns/unsubscribe',
        { bodyLimit: 1024, logLevel: 'silent' },
        async (request, reply) => {
            reply.header('Cache-Control', 'no-store').header('Referrer-Policy', 'no-referrer');
            if (
                !(request.body instanceof URLSearchParams) ||
                request.body.get('List-Unsubscribe') !== 'One-Click' ||
                typeof request.query.token !== 'string'
            ) {
                return reply.code(400).send({ success: false });
            }
            try {
                await unsubscribeFromCampaignEmails(request.query.token);
                return reply.send({ success: true });
            } catch (error) {
                return reply
                    .code(error instanceof TRPCError && error.code === 'BAD_REQUEST' ? 400 : 503)
                    .send({ success: false });
            }
        }
    );
};

export const app = Fastify({ logger: false, bodyLimit: 1024 });
app.register(campaignUnsubscribeFastifyPlugin);
export default app;
