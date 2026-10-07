import { bootstrapLambda } from '@learncard/service-config';

import { base, stages } from './src/config/stageConfig';

type LambdaApp = typeof import('./lambdaApp');

const getApplication = bootstrapLambda<LambdaApp>({
    base,
    stages,
    stage: process.env.AWS_LAMBDA_FUNCTION_NAME
        ? process.env.LAMBDA_STAGE
        : process.env.CONFIG_STAGE,
    importApp: () => import('./lambdaApp'),
});

export const trpcHandler = async (...args: Parameters<LambdaApp['trpcHandler']>) =>
    (await getApplication()).trpcHandler(...args);

export const openApiHandler = async (...args: Parameters<LambdaApp['openApiHandler']>) =>
    (await getApplication()).openApiHandler(...args);

export const swaggerUiHandler = async (...args: Parameters<LambdaApp['swaggerUiHandler']>) =>
    (await getApplication()).swaggerUiHandler(...args);

export const didWebHandler = async (...args: Parameters<LambdaApp['didWebHandler']>) =>
    (await getApplication()).didWebHandler(...args);

// Preserve the local/offline handler name without importing the full API for OIDC.
export { handler as oidcHandler } from './oidcLambda';
