import { bootstrapLambda } from '@learncard/service-config';

import { base, stages } from './src/config/stageConfig';

type ContractEventsApp = typeof import('./contractEventsLambdaApp');

const getApplication = bootstrapLambda<ContractEventsApp>({
    base,
    stages,
    stage: process.env.AWS_LAMBDA_FUNCTION_NAME
        ? process.env.LAMBDA_STAGE
        : process.env.CONFIG_STAGE,
    importApp: () => import('./contractEventsLambdaApp'),
});

export const contractEventsHandler = async (
    ...args: Parameters<ContractEventsApp['contractEventsHandler']>
) => (await getApplication()).contractEventsHandler(...args);
