import { bootstrapLambda } from '@learncard/service-config';
import type { consentFlowDeadlineHandler as DeadlineHandler } from './consentFlowDeadlineLambdaApp';

import { base, stages } from './src/config/stageConfig';

type ConsentFlowDeadlineApp = { consentFlowDeadlineHandler: typeof DeadlineHandler };

const getApplication = bootstrapLambda<ConsentFlowDeadlineApp>({
    base,
    stages,
    stage: process.env.AWS_LAMBDA_FUNCTION_NAME
        ? process.env.LAMBDA_STAGE
        : process.env.CONFIG_STAGE,
    importApp: () => import('./consentFlowDeadlineLambdaApp'),
});

export const consentFlowDeadlineHandler: typeof DeadlineHandler = (...args) =>
    getApplication().then(app => app.consentFlowDeadlineHandler(...args));
