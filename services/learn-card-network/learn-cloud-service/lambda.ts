import http from 'node:http';

import serverlessHttp from 'serverless-http';
import type { Context, APIGatewayProxyResultV2, APIGatewayProxyEventV2 } from 'aws-lambda';
import { awsLambdaRequestHandler } from '@trpc/server/adapters/aws-lambda';
import { createOpenApiHttpHandler } from 'trpc-to-openapi';
import { TRPC_ERROR_CODE_HTTP_STATUS } from 'trpc-openapi/dist/adapters/node-http/errors';
import * as Sentry from '@sentry/serverless';

import app from './src/openapi';
import { appRouter, createContext } from './src/app';

Sentry.AWSLambda.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENV,
    enabled: Boolean(process.env.SENTRY_DSN),
    tracesSampleRate: 1.0,
    integrations: [
        new Sentry.Integrations.Console(),
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.ContextLines(),
        new Sentry.Integrations.Mongo(),
    ],
});

export const swaggerUiHandler = serverlessHttp(app, { basePath: '/docs' });

export const _openApiHandler = serverlessHttp(
    http.createServer(
        createOpenApiHttpHandler({
            router: appRouter,
            createContext,
            responseMeta: undefined,
            maxBodySize: undefined,
            onError: ({ error, ctx, path }) => {
                error.stack = error.stack?.replace('Mr: ', '');
                error.name = error.message;

                // We want to ignore invalid challenge errors because they are normal
                if (!(error.code === 'UNAUTHORIZED' && !ctx?.user?.isChallengeValid)) {
                    Sentry.captureException(error, { extra: { ctx, path } });
                    Sentry.getActiveTransaction()?.setHttpStatus(
                        TRPC_ERROR_CODE_HTTP_STATUS[error.code]
                    );
                }
            },
        })
    ),
    { basePath: '/api' }
);

export const _trpcHandler = awsLambdaRequestHandler({
    allowMethodOverride: true,
    router: appRouter,
    createContext,
    onError: ({ error, ctx, path }) => {
        error.stack = error.stack?.replace('Mr: ', '');
        error.name = error.message;

        // We want to ignore invalid challenge errors because they are normal
        if (!(error.code === 'UNAUTHORIZED' && !ctx?.user?.isChallengeValid)) {
            Sentry.captureException(error, { extra: { ctx, path } });
            Sentry.getActiveTransaction()?.setHttpStatus(TRPC_ERROR_CODE_HTTP_STATUS[error.code]);
        }
    },
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
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*',
                    'Access-Control-Allow-Methods': '*',
                },
            };
        }

        context.callbackWaitsForEmptyEventLoop = false;

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

        context.callbackWaitsForEmptyEventLoop = false;

        return _trpcHandler(event, context);
    }
);
