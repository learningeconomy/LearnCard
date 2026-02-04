import path from 'path';

import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import { fastifyTRPCPlugin, FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import { fastifyTRPCOpenApiPlugin, CreateOpenApiFastifyPluginOptions } from 'trpc-to-openapi';
import {
    SQSClient,
    CreateQueueCommand,
    ReceiveMessageCommand,
    DeleteMessageCommand,
} from '@aws-sdk/client-sqs';

import { appRouter, type AppRouter, createContext } from './app';
import { openApiDocument } from './openapi';
import { didFastifyPlugin } from './dids';
import { skillsViewerFastifyPlugin } from './skills-viewer';
import { sendNotification } from '@helpers/notifications.helpers';
import { LCNNotificationValidator } from '@learncard/types';
import { startEdlinkPolling } from '@services/edlink-polling.service';

const server = Fastify({ maxParamLength: 5000 });

server.addHook('onRequest', (request, _reply, done) => {
    const raw = request.raw as any;
    const decorated = request as any;

    const ensureMethod = (method: 'on' | 'once' | 'off' | 'emit' | 'removeListener') => {
        if (typeof decorated[method] === 'function') return;

        if (typeof raw[method] === 'function') {
            decorated[method] = raw[method].bind(raw);
            return;
        }

        if (method === 'off' && typeof raw.removeListener === 'function') {
            decorated.off = raw.removeListener.bind(raw);
        }
    };

    ensureMethod('on');
    ensureMethod('once');
    ensureMethod('emit');
    ensureMethod('removeListener');
    ensureMethod('off');

    if (decorated.socket === undefined) decorated.socket = raw.socket;
    if (decorated.connection === undefined) decorated.connection = raw.connection;
    if (decorated.headers === undefined) decorated.headers = raw.headers;

    done();
});

server.register(fastifyCors);

server.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
        allowMethodOverride: true,
        router: appRouter,
        createContext,
        onError({ path, error }) {
            // report to error monitoring
            console.error(`Error in tRPC handler on path '${path}':`, error);
        },
    } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions'],
});

server.register(fastifyTRPCOpenApiPlugin, {
    basePath: '/api',
    router: appRouter,
    createContext,
    onError({ path, error }) {
        // report to error monitoring
        console.error(`Error in API handler on path '${path}':`, error);
    },
} satisfies CreateOpenApiFastifyPluginOptions<AppRouter>);

server.get('/docs/openapi.json', () => openApiDocument);
server.register(fastifyStatic, {
    root: path.join(__dirname, '../src/swagger-ui'),
    prefix: '/docs/',
});

server.register(didFastifyPlugin);
server.register(skillsViewerFastifyPlugin);

(async () => {
    try {
        console.log('Server starting on port ', process.env.PORT || 3000);
        await server.listen({ host: '0.0.0.0', port: Number(process.env.PORT || 3000) });
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();

const pollUrl = process.env.NOTIFICATIONS_QUEUE_POLL_URL;

if (pollUrl) {
    (async () => {
        const parts = pollUrl.split('/');

        const queueName = parts.pop();
        const baseUrl = parts.join('/');

        const sqs = new SQSClient({
            apiVersion: 'latest',
            region: process.env.AWS_REGION,
            endpoint: baseUrl,
        });

        await sqs.send(new CreateQueueCommand({ QueueName: queueName }));

        const receiveMessage = async () => {
            const command = new ReceiveMessageCommand({
                QueueUrl: pollUrl,
                MaxNumberOfMessages: 1,
                WaitTimeSeconds: 20,
            });

            const { Messages: messages } = await sqs.send(command);

            if (messages) {
                await Promise.all(
                    messages.map(async message => {
                        try {
                            const _notification = JSON.parse(message.Body ?? '');

                            const notification = await LCNNotificationValidator.parseAsync(
                                _notification
                            );

                            await sendNotification(notification);

                            const deleteCommand = new DeleteMessageCommand({
                                QueueUrl: pollUrl,
                                ReceiptHandle: message.ReceiptHandle,
                            });

                            return await sqs.send(deleteCommand);
                        } catch (error) {
                            console.error('Invalid Notification Object', message.Body);
                            return;
                        }
                    })
                );
            }
        };

        setInterval(receiveMessage, 10_000);
    })();
}

// Start Ed.link polling service for automatic credential issuance
startEdlinkPolling();
