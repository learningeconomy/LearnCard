import http from 'node:http';

import serverlessHttp from 'serverless-http';
import type {
    Context,
    APIGatewayProxyResultV2,
    APIGatewayProxyEventV2,
    SQSHandler,
} from 'aws-lambda';
import { LCNNotificationValidator } from '@learncard/types';
import { awsLambdaRequestHandler } from '@trpc/server/adapters/aws-lambda';
import * as Sentry from '@sentry/serverless';

import app from './src/openapi';
import skillsViewerApp from './src/skills-viewer';
import { appRouter, createContext } from './src/app';
import { sendNotification } from './src/helpers/notifications.helpers';
import { startSkillEmbeddingBackfill } from './src/helpers/skill-embedding.helpers';
import { createOpenApiAwsLambdaHandler } from './src/helpers/shim';
import { handleTrpcError, sentryBeforeSend, getTracesSampleRate } from './src/helpers/sentry.helpers';

Sentry.AWSLambda.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENV,
    enabled: Boolean(process.env.SENTRY_DSN),
    tracesSampleRate: getTracesSampleRate(),
    beforeSend: sentryBeforeSend,
    integrations: [
        new Sentry.Integrations.Console(),
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.ContextLines(),
    ],
});

startSkillEmbeddingBackfill().catch(err => console.error('Skill embedding backfill startup error:', err));

export const swaggerUiHandler = serverlessHttp(app, { basePath: '/docs' });

export const skillsViewerHandler = serverlessHttp(skillsViewerApp);

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

export const notificationsWorker: SQSHandler = Sentry.AWSLambda.wrapHandler(
    async (event, context) => {
        await Promise.all(
            event.Records.map(async record => {
                try {
                    const _notification = JSON.parse(record.body);

                    const notification = await LCNNotificationValidator.parseAsync(_notification);

                    await sendNotification(notification);
                } catch (error) {
                    console.error('Invalid Notification Object', record.body);
                }
            })
        );
    }
);
