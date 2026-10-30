import { bootstrapLambda } from '@learncard/service-config';
import type * as LambdaApplication from './lambdaApp';

import { base, stages } from './src/config/stageConfig';

type LambdaApp = typeof LambdaApplication;

const getApplication = bootstrapLambda<LambdaApp>({
    base,
    stages,
    stage: process.env.AWS_LAMBDA_FUNCTION_NAME
        ? process.env.LAMBDA_STAGE
        : process.env.CONFIG_STAGE,
    // Stage configuration must be installed before importing database-bound modules.
    importApp: () => import('./lambdaApp'),
});

let migrationReadiness: Promise<void> | undefined;
const ensureMigrationReady = async () => {
    if (!migrationReadiness) {
        const migration = import('./src/helpers/consentflow-legacy-migration.helpers').then(
            ({ migrateLegacyConsentFlowContracts }) => migrateLegacyConsentFlowContracts()
        );
        migrationReadiness = migration;
        migration.catch(() => {
            if (migrationReadiness === migration) migrationReadiness = undefined;
        });
    }
    await migrationReadiness;
};

const getReadyApplication = async () => {
    const application = await getApplication();
    await ensureMigrationReady();
    return application;
};

export const trpcHandler = async (...args: Parameters<LambdaApp['trpcHandler']>) =>
    (await getReadyApplication()).trpcHandler(...args);

export const openApiHandler = async (...args: Parameters<LambdaApp['openApiHandler']>) =>
    (await getReadyApplication()).openApiHandler(...args);

export const _trpcHandler = async (...args: Parameters<LambdaApp['_trpcHandler']>) =>
    (await getReadyApplication())._trpcHandler(...args);

export const _openApiHandler = async (...args: Parameters<LambdaApp['_openApiHandler']>) =>
    (await getReadyApplication())._openApiHandler(...args);

export const swaggerUiHandler = async (...args: Parameters<LambdaApp['swaggerUiHandler']>) =>
    (await getReadyApplication()).swaggerUiHandler(...args);

export const skillsViewerHandler = async (...args: Parameters<LambdaApp['skillsViewerHandler']>) =>
    (await getReadyApplication()).skillsViewerHandler(...args);

export const statusListsHandler = async (...args: Parameters<LambdaApp['statusListsHandler']>) =>
    (await getReadyApplication()).statusListsHandler(...args);

export const credentialRefreshHandler = async (
    ...args: Parameters<LambdaApp['credentialRefreshHandler']>
) => (await getReadyApplication()).credentialRefreshHandler(...args);

export const inboxQueueWorker = async (...args: Parameters<LambdaApp['inboxQueueWorker']>) =>
    (await getReadyApplication()).inboxQueueWorker(...args);

export const inboxQueueDispatcher = async (
    ...args: Parameters<LambdaApp['inboxQueueDispatcher']>
) => (await getReadyApplication()).inboxQueueDispatcher(...args);

export const inboxDeadLetterWorker = async (
    ...args: Parameters<LambdaApp['inboxDeadLetterWorker']>
) => (await getReadyApplication()).inboxDeadLetterWorker(...args);

export const notificationsWorker = async (...args: Parameters<LambdaApp['notificationsWorker']>) =>
    (await getReadyApplication()).notificationsWorker(...args);

export const inboxMaintenanceHandler = async (
    ...args: Parameters<LambdaApp['inboxMaintenanceHandler']>
) => (await getReadyApplication()).inboxMaintenanceHandler(...args);
