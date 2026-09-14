import serverlessHttp from 'serverless-http';
import type { Context, APIGatewayProxyResultV2, APIGatewayProxyEventV2 } from 'aws-lambda';
import { awsLambdaRequestHandler } from '@trpc/server/adapters/aws-lambda';
import * as Sentry from '@sentry/serverless';

import app from './src/openapi';
import didWebApp from './src/dids';
import { appRouter, createContext } from './src/app';
import { getEmptyLearnCard } from './src/helpers/learnCard.helpers';
import { createOpenApiAwsLambdaHandler } from './src/helpers/shim';
import {
    handleTrpcError,
    sentryBeforeSend,
    getTracesSampleRate,
} from './src/helpers/sentry.helpers';
import { environment } from './src/config/environment';
import { toServerlessApplication } from './src/helpers/serverlessApplication';
import { ensureUserKeysIndexes } from './src/models';

const startupPromise = Promise.all([
    getEmptyLearnCard(), // Load WASM in for better cold starts
    ensureUserKeysIndexes(),
]);

const isWarmupEvent = (event: APIGatewayProxyEventV2): boolean =>
    'source' in event && event.source === 'serverless-plugin-warmup';

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
        new Sentry.Integrations.Mongo(),
    ],
});

export const swaggerUiHandler = serverlessHttp(toServerlessApplication(app), {
    basePath: '/docs',
});
export const didWebHandler = serverlessHttp(toServerlessApplication(didWebApp));

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
        await startupPromise;

        if (isWarmupEvent(event)) {
            console.log('[Warmup] Initializing LearnCard...');
            await getEmptyLearnCard();
            console.log('[Warmup] Done!');
            return 'All done! 😄';
        }

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

        return _openApiHandler(event, context);
    }
);

export const trpcHandler = Sentry.AWSLambda.wrapHandler(
    async (event: APIGatewayProxyEventV2, context: Context): Promise<APIGatewayProxyResultV2> => {
        await startupPromise;

        if (isWarmupEvent(event)) {
            console.log('[Warmup] Initializing LearnCard...');
            await getEmptyLearnCard();
            console.log('[Warmup] Done!');
            return 'All done! 😄';
        }

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
