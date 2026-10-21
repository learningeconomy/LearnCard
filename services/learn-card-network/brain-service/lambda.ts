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

export const swaggerUiHandler = async (...args: Parameters<LambdaApp['swaggerUiHandler']>) =>
    (await getApplication()).swaggerUiHandler(...args);

export const skillsViewerHandler = async (...args: Parameters<LambdaApp['skillsViewerHandler']>) =>
    (await getApplication()).skillsViewerHandler(...args);

export const statusListsHandler = async (...args: Parameters<LambdaApp['statusListsHandler']>) =>
    (await getApplication()).statusListsHandler(...args);

export const credentialRefreshHandler = async (
    ...args: Parameters<LambdaApp['credentialRefreshHandler']>
) => (await getApplication()).credentialRefreshHandler(...args);

export const inboxQueueWorker = async (...args: Parameters<LambdaApp['inboxQueueWorker']>) =>
    (await getApplication()).inboxQueueWorker(...args);

export const inboxQueueDispatcher = async (
    ...args: Parameters<LambdaApp['inboxQueueDispatcher']>
) => (await getApplication()).inboxQueueDispatcher(...args);

export const inboxDeadLetterWorker = async (
    ...args: Parameters<LambdaApp['inboxDeadLetterWorker']>
) => (await getApplication()).inboxDeadLetterWorker(...args);

export const notificationsWorker = async (...args: Parameters<LambdaApp['notificationsWorker']>) =>
    (await getApplication()).notificationsWorker(...args);

export const inboxMaintenanceHandler = async (
    ...args: Parameters<LambdaApp['inboxMaintenanceHandler']>
) => (await getApplication()).inboxMaintenanceHandler(...args);
