import 'dotenv/config';
import { applyStageConfig } from '@learncard/service-config';

import baseConfig from '../../config/config.json';
import devConfig from '../../config/config.dev.json';
import productionConfig from '../../config/config.production.json';
import scoutsDevConfig from '../../config/config.scouts.dev.json';
import scoutsProductionConfig from '../../config/config.scouts.production.json';

export const base: Record<string, string> = baseConfig;

export const stages = {
    dev: devConfig,
    production: productionConfig,
    // ScoutPass deploys the same services and stage names; CONFIG_TENANT=scouts selects these.
    'scouts.dev': scoutsDevConfig,
    'scouts.production': scoutsProductionConfig,
} satisfies Record<string, Record<string, string>>;

// Must run before any module that reads configuration on import (e.g. @environment):
// merges base + the selected stage into process.env; explicit non-empty env still wins.
export const applyLearnCloudStageConfig = (stage: string | undefined): void => {
    applyStageConfig({ base, stages, stage });
};
