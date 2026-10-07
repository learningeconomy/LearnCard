import 'dotenv/config';
import { applyStageConfig } from '@learncard/service-config';

import baseConfig from '../../config/config.json';
import devConfig from '../../config/config.dev.json';
import productionConfig from '../../config/config.production.json';

export const base: Record<string, string> = baseConfig;

export const stages = {
    dev: devConfig,
    production: productionConfig,
} satisfies Record<string, Record<string, string>>;

// Must run before any module that reads configuration on import (e.g. @environment):
// merges base + the selected stage into process.env; explicit non-empty env still wins.
export const applyBrainServiceStageConfig = (stage: string | undefined): void => {
    applyStageConfig({ base, stages, stage });
};
