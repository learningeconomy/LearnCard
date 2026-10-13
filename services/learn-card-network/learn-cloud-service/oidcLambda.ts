import { bootstrapLambda } from '@learncard/service-config';

import { base, stages } from './src/config/stageConfig';

type OidcApp = typeof import('./oidcLambdaApp');

const getApplication = bootstrapLambda<OidcApp>({
    base,
    stages,
    stage: process.env.AWS_LAMBDA_FUNCTION_NAME
        ? process.env.LAMBDA_STAGE
        : process.env.CONFIG_STAGE,
    importApp: () => import('./oidcLambdaApp'),
});

export const oidcHandler = async (...args: Parameters<OidcApp['oidcHandler']>) =>
    (await getApplication()).oidcHandler(...args);
