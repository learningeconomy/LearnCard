import path from 'path';

import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import { fastifyTRPCPlugin, type FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import { fastifyTRPCOpenApiPlugin, type CreateOpenApiFastifyPluginOptions } from 'trpc-to-openapi';
import {
    SQSClient,
    CreateQueueCommand,
    ReceiveMessageCommand,
    DeleteMessageCommand,
} from '@aws-sdk/client-sqs';

import { appRouter, type AppRouter, createContext } from './app';
import { openApiDocument } from './openapi';
import { didFastifyPlugin } from './dids';
import { sendNotification } from '@helpers/notifications.helpers';
import { LCNNotificationValidator } from '@learncard/types';

const server = Fastify({ maxParamLength: 5000 });

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

(async () => {
    try {
        console.log('Server starting on port', process.env.PORT || 3000);
        await server.listen({ host: '0.0.0.0', port: Number(process.env.PORT || 3000) });
    } catch (error) {
        console.error(error);
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
                        } catch {
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
