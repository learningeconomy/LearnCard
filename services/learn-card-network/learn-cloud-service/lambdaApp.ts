import serverlessHttp from 'serverless-http';
import type { Context, APIGatewayProxyResultV2, APIGatewayProxyEventV2 } from 'aws-lambda';
import { awsLambdaRequestHandler } from '@trpc/server/adapters/aws-lambda';
import * as Sentry from '@sentry/serverless';
import Fastify, { type FastifyInstance } from 'fastify';

import app from './src/openapi';
import { appRouter, createContext } from './src/app';
import { createOpenApiAwsLambdaHandler } from './src/helpers/shim';
import {
    handleTrpcError,
    sentryBeforeSend,
    getTracesSampleRate,
} from './src/helpers/sentry.helpers';
import { environment } from './src/config/environment';
import { toServerlessApplication } from './src/helpers/serverlessApplication';
import {
    assertShareContentEnvironmentConfiguration,
    createShareContentRuntimeFromEnvironment,
    registerShareContentRoutes,
} from './src/share-content';

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

// Fail the cold start on an enabled-but-invalid LC-2187 share-content
// configuration; a disabled configuration is a no-op.
assertShareContentEnvironmentConfiguration();

let shareContentProxyPromise: Promise<ReturnType<typeof serverlessHttp> | null> | null = null;

/**
 * Lazy per-container boot for the LC-2187 service routes. Resolving the runtime
 * awaits repository index initialization and opens Redis only when enabled, so a
 * disabled deployment installs nothing and returns 404 for every internal path.
 */
const getShareContentProxy = async (): Promise<ReturnType<typeof serverlessHttp> | null> => {
    if (!shareContentProxyPromise) {
        shareContentProxyPromise = (async () => {
            const runtime = await createShareContentRuntimeFromEnvironment();

            if (!runtime.enabled) return null;

            const shareContentApp: FastifyInstance = Fastify({ maxParamLength: 5000 });
            await registerShareContentRoutes(shareContentApp, runtime);
            await shareContentApp.ready();

            return serverlessHttp(toServerlessApplication(shareContentApp.server));
        })();
    }

    return shareContentProxyPromise;
};

export const shareContentHandler = async (
    event: APIGatewayProxyEventV2,
    context: Context
): Promise<APIGatewayProxyResultV2> => {
    let proxy: ReturnType<typeof serverlessHttp> | null;

    try {
        proxy = await getShareContentProxy();
    } catch {
        // Never return a raw boot error. Allow a later invocation to retry.
        shareContentProxyPromise = null;

        return {
            statusCode: 503,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
            body: JSON.stringify({ ok: false, error: 'UNAVAILABLE' }),
        };
    }

    if (!proxy) {
        return { statusCode: 404, headers: { 'Cache-Control': 'no-store' }, body: '' };
    }

    return proxy(event, context);
};

export const swaggerUiHandler = serverlessHttp(toServerlessApplication(app), {
    basePath: '/docs',
});

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
