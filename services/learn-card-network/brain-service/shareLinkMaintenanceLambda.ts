import { bootstrapLambda } from '@learncard/service-config';

import { base, stages } from './src/config/stageConfig';

type ShareLinkMaintenanceApp = typeof import('./shareLinkMaintenanceLambdaApp');

const getApplication = bootstrapLambda<ShareLinkMaintenanceApp>({
    base,
    stages,
    stage: process.env.AWS_LAMBDA_FUNCTION_NAME
        ? process.env.LAMBDA_STAGE
        : process.env.CONFIG_STAGE,
    importApp: () => import('./shareLinkMaintenanceLambdaApp'),
});

export const shareLinkMaintenanceHandler = async (
    ...args: Parameters<ShareLinkMaintenanceApp['shareLinkMaintenanceHandler']>
) => (await getApplication()).shareLinkMaintenanceHandler(...args);
