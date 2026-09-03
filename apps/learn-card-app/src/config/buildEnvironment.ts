import { z } from 'zod';
import {
    optionalEnvironmentBoolean,
    optionalEnvironmentPort,
    optionalEnvironmentString,
    parseEnvironment,
} from '@learncard/helpers';

export const learnCardAppEnvironmentShape = {
    MODE: z.string().trim().min(1),
    VITE_ENABLE_AUTH_DEBUG_WIDGET: optionalEnvironmentBoolean.default(false),
    VITE_DOCKER_SOURCE: optionalEnvironmentBoolean.default(false),
    VITE_APP_VERSION: optionalEnvironmentString,
    ANALYZE: optionalEnvironmentBoolean.default(false),
    CHOKIDAR_USEPOLLING: optionalEnvironmentBoolean.default(false),
    CHOKIDAR_INTERVAL: optionalEnvironmentPort.default(1000),
    GITHUB_SHA: optionalEnvironmentString,
    HEROKU_SLUG_COMMIT: optionalEnvironmentString,
    VERCEL_GIT_COMMIT_SHA: optionalEnvironmentString,
    BUILD_SHA: optionalEnvironmentString,
} satisfies z.ZodRawShape;

export const learnCardAppEnvironmentSchema = z.object(learnCardAppEnvironmentShape);

type ViteCommand = 'serve' | 'build';

export type LearnCardAppEnvironment = z.output<typeof learnCardAppEnvironmentSchema> & {
    DEV: boolean;
    PROD: boolean;
};

export const parseLearnCardAppEnvironment = (
    raw: Record<string, unknown>,
    source: string,
    command: ViteCommand = 'build'
): LearnCardAppEnvironment => {
    const environment = parseEnvironment(learnCardAppEnvironmentSchema, raw, {
        project: 'learn-card-app',
        source,
        examplePath: 'apps/learn-card-app/.env.example',
    });

    return {
        ...environment,
        DEV: command === 'serve',
        PROD: command === 'build',
    };
};
