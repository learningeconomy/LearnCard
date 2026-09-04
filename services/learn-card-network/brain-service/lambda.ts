import serverlessHttp from 'serverless-http';
import type {
    Context,
    APIGatewayProxyResultV2,
    APIGatewayProxyEventV2,
    SQSBatchResponse,
    SQSHandler,
} from 'aws-lambda';
import { awsLambdaRequestHandler } from '@trpc/server/adapters/aws-lambda';
import * as Sentry from '@sentry/serverless';

import app from './src/openapi';
import skillsViewerApp from './src/skills-viewer';
import statusListsApp from './src/status-lists';
import credentialRefreshApp from './src/credential-refresh';
import { appRouter, createContext } from './src/app';
import { deliverQueuedNotification } from './src/helpers/notificationQueue.helpers';
import { startSkillEmbeddingBackfill } from './src/helpers/skill-embedding.helpers';
import { createOpenApiAwsLambdaHandler } from './src/helpers/shim';
import {
    handleTrpcError,
    sentryBeforeSend,
    getTracesSampleRate,
} from './src/helpers/sentry.helpers';
import { environment } from './src/config/environment';
import { toServerlessApplication } from './src/helpers/serverlessApplication';

Sentry.AWSLambda.init({
    dsn: environment.SENTRY_DSN,
    environment: environment.SENTRY_ENV,
    enabled: Boolean(environment.SENTRY_DSN),
    tracesSampleRate: getTracesSampleRate(),
    beforeSend: sentryBeforeSend,
    integrations: [
        new Sentry.Integrations.Console(),
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.ContextLines(),
    ],
});

startSkillEmbeddingBackfill().catch(err =>
    console.error('Skill embedding backfill startup error:', err)
);

export const swaggerUiHandler = serverlessHttp(toServerlessApplication(app), {
    basePath: '/docs',
});

export const skillsViewerHandler = serverlessHttp(toServerlessApplication(skillsViewerApp));

export const statusListsHandler = serverlessHttp(toServerlessApplication(statusListsApp));

export const credentialRefreshHandler = serverlessHttp(credentialRefreshApp);

export const _openApiHandler = createOpenApiAwsLambdaHandler({
    router: appRouter,
    responseMeta: () => {
        return {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Authorization, Content-Type',
            },
        };
    },
    createContext,
    onError: handleTrpcError,
});

export const _trpcHandler = awsLambdaRequestHandler({
    allowMethodOverride: true,
    router: appRouter,
    createContext,
    onError: handleTrpcError,
    responseMeta: () => {
        return {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': '*',
                'Access-Control-Allow-Headers': 'authorization',
            },
        };
    },
});

export const openApiHandler = Sentry.AWSLambda.wrapHandler(
    async (event: APIGatewayProxyEventV2, context: Context): Promise<APIGatewayProxyResultV2> => {
        if (event.requestContext.http.method === 'OPTIONS') {
            return {
                statusCode: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                },
            };
        }

        return _openApiHandler(event, context);
    }
);

export const trpcHandler = Sentry.AWSLambda.wrapHandler(
    async (event: APIGatewayProxyEventV2, context: Context): Promise<APIGatewayProxyResultV2> => {
        if (event.requestContext.http.method === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*',
                    'Access-Control-Allow-Methods': '*',
                },
            };
        }

        return _trpcHandler(event, context);
    }
);

export const notificationsWorker: SQSHandler = Sentry.AWSLambda.wrapHandler(async event => {
    const batchItemFailures = await Promise.all(
        event.Records.map(async record => {
            try {
                await deliverQueuedNotification(record.body);

                return undefined;
            } catch (error) {
                console.error('Notification queue record failed', {
                    messageId: record.messageId,
                    error,
                });

                return { itemIdentifier: record.messageId };
            }
        })
    );

    return {
        batchItemFailures: batchItemFailures.filter(
            (failure): failure is { itemIdentifier: string } => failure !== undefined
        ),
    } satisfies SQSBatchResponse;
});
