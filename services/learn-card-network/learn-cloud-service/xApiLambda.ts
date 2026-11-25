import { bootstrapLambda } from '@learncard/service-config';

import { base, stages } from './src/config/stageConfig';

type XApiApp = typeof import('./xApiLambdaApp');

const getApplication = bootstrapLambda<XApiApp>({
    base,
    stages,
    stage: process.env.AWS_LAMBDA_FUNCTION_NAME
        ? process.env.LAMBDA_STAGE
        : process.env.CONFIG_STAGE,
    importApp: () => import('./xApiLambdaApp'),
});

export const xApiHandler = async (...args: Parameters<XApiApp['xApiHandler']>) =>
    (await getApplication()).xApiHandler(...args);
