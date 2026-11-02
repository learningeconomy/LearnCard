import Fastify, { type FastifyPluginAsync } from 'fastify';
import { TRPCError } from '@trpc/server';
import { unsubscribeFromCampaignEmails } from '@helpers/campaign-unsubscribe.helpers';

/** RFC 8058 endpoint: form POSTs work without cookies, redirects, or a JavaScript client. */
export const campaignUnsubscribeFastifyPlugin: FastifyPluginAsync = async app => {
    app.addContentTypeParser(
        'application/x-www-form-urlencoded',
        { parseAs: 'string', bodyLimit: 1024 },
        (_request, body, done) => {
            done(null, new URLSearchParams(String(body)));
        }
    );
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
