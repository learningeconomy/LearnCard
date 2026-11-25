import type { Context } from 'aws-lambda';
import { bootstrapLambda } from '@learncard/service-config';

import { base, stages } from './src/config/stageConfig';
import type { SeedMigrationResult } from './src/types/seed-migration';

type SeedMigrationApp = typeof import('./seedMigrationApp');

const getApplication = bootstrapLambda<SeedMigrationApp>({
    base,
    stages,
    stage: process.env.AWS_LAMBDA_FUNCTION_NAME
        ? process.env.LAMBDA_STAGE
        : process.env.CONFIG_STAGE,
    importApp: () => import('./seedMigrationApp'),
});

export const handler = async (event: unknown, context: Context): Promise<SeedMigrationResult> =>
    (await getApplication()).handler(event, context);
