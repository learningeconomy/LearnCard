import { bootstrapLambda } from '@learncard/service-config';

import { base, stages } from './src/config/stageConfig';

type DidWebApp = typeof import('./didWebLambdaApp');

const getApplication = bootstrapLambda<DidWebApp>({
    base,
    stages,
    stage: process.env.AWS_LAMBDA_FUNCTION_NAME
        ? process.env.LAMBDA_STAGE
        : process.env.CONFIG_STAGE,
    importApp: () => import('./didWebLambdaApp'),
});

export const didWebHandler = async (...args: Parameters<DidWebApp['didWebHandler']>) =>
    (await getApplication()).didWebHandler(...args);
