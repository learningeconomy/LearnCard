import { applyBrainServiceStageConfig } from './stageConfig';

// Side-effect import: runs before @environment is evaluated so Docker/local processes
// pick up checked-in per-stage config. Keyed on CONFIG_STAGE (Lambda uses LAMBDA_STAGE);
// explicit non-empty env values from the developer's .env still win.
applyBrainServiceStageConfig(process.env.CONFIG_STAGE);
