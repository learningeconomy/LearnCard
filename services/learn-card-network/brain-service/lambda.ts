import serverlessHttp from 'serverless-http';
import { awsLambdaRequestHandler } from '@trpc/server/adapters/aws-lambda';
import { createOpenApiAwsLambdaHandler } from 'trpc-openapi';

import app from './src/openapi';
import didWebApp from './src/dids';
import { appRouter, createContext } from './src/app';

export const swaggerUiHandler = serverlessHttp(app, { basePath: '/docs' });
export const didWebHandler = serverlessHttp(didWebApp, { basePath: '/users' });

export const openApiHandler = createOpenApiAwsLambdaHandler({
    router: appRouter,
    createContext,
});

export const trpcHandler = awsLambdaRequestHandler({ router: appRouter, createContext });
