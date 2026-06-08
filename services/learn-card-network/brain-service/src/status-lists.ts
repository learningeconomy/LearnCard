import Fastify, { FastifyPluginAsync } from 'fastify';
import fastifyCors from '@fastify/cors';

import { getSignedStatusListCredential } from '@helpers/status-list.helpers';

export const app = Fastify();

app.register(fastifyCors);

export const statusListsFastifyPlugin: FastifyPluginAsync = async fastify => {
    fastify.options('/status-lists/:id', async (_request, reply) => {
        reply.status(200);
        reply.header('Access-Control-Allow-Origin', '*');
        reply.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
        reply.header('Access-Control-Allow-Headers', '*');
        return reply.send();
    });

    fastify.get('/status-lists/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const credential = await getSignedStatusListCredential(id);

        if (!credential) return reply.status(404).send();

        reply.header('Access-Control-Allow-Origin', '*');
        reply.header('Cache-Control', 'public, max-age=60');
        reply.type('application/json');

        return reply.send(credential);
    });
};

app.register(statusListsFastifyPlugin);

export default app;
