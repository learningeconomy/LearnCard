import serverlessHttp from 'serverless-http';
import type { Context, APIGatewayProxyResultV2, APIGatewayProxyEventV2 } from 'aws-lambda';
import { awsLambdaRequestHandler } from '@trpc/server/adapters/aws-lambda';
import { createOpenApiAwsLambdaHandler } from 'trpc-openapi';

import app from './src/openapi';
import didWebApp from './src/dids';
import { appRouter, createContext } from './src/app';

export const swaggerUiHandler = serverlessHttp(app, { basePath: '/docs' });
export const didWebHandler = serverlessHttp(didWebApp, { basePath: '/users' });

export const _openApiHandler = createOpenApiAwsLambdaHandler({
    router: appRouter,
    createContext,
});

export const _trpcHandler = awsLambdaRequestHandler({
    router: appRouter,
    createContext,
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

export const openApiHandler = async (
    event: APIGatewayProxyEventV2,
    context: Context
): Promise<APIGatewayProxyResultV2> => {
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
};

export const trpcHandler = async (
    event: APIGatewayProxyEventV2,
    context: Context
): Promise<APIGatewayProxyResultV2> => {
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
};
