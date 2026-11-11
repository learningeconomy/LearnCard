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

export const _trpcHandler = async (...args: Parameters<LambdaApp['_trpcHandler']>) =>
    (await getApplication())._trpcHandler(...args);

export const _openApiHandler = async (...args: Parameters<LambdaApp['_openApiHandler']>) =>
    (await getApplication())._openApiHandler(...args);

export const shareContentHandler = async (...args: Parameters<LambdaApp['shareContentHandler']>) =>
    (await getApplication()).shareContentHandler(...args);

export const swaggerUiHandler = async (...args: Parameters<LambdaApp['swaggerUiHandler']>) =>
    (await getApplication()).swaggerUiHandler(...args);
