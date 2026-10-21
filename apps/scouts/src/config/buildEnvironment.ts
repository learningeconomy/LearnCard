import { z } from 'zod';
import {
    optionalEnvironmentBoolean,
    optionalEnvironmentUrl,
    optionalEnvironmentString,
    parseEnvironment,
    requiredEnvironmentString,
} from '@learncard/helpers';

export const scoutsEnvironmentShape = {
    MODE: z.string().trim().min(1),
    VITE_NODE_ENV: z.enum([
        'development',
        'development-local',
        'staging',
        'staging-scoutpass',
        'production',
        'production-scoutpass',
    ]),
    VITE_ENABLE_AUTH_DEBUG_WIDGET: optionalEnvironmentBoolean.default(false),
    VITE_DOCKER_SOURCE: optionalEnvironmentBoolean.default(false),
    VITE_WEB3AUTH_CLIENT_ID: requiredEnvironmentString,
    VITE_WEB3AUTH_RPC_TARGET: optionalEnvironmentUrl.default('https://rpc.ankr.com/eth'),
    GOOGLE_MAPS_API_KEY: optionalEnvironmentString,
    GITHUB_SHA: optionalEnvironmentString,
    HEROKU_SLUG_COMMIT: optionalEnvironmentString,
    VERCEL_GIT_COMMIT_SHA: optionalEnvironmentString,
    BUILD_SHA: optionalEnvironmentString,
} satisfies z.ZodRawShape;

export const scoutsEnvironmentSchema = z.object(scoutsEnvironmentShape).transform(environment => ({
    ...environment,
    DEV: environment.MODE !== 'production',
    PROD: environment.MODE === 'production',
}));

export type ScoutsEnvironment = z.output<typeof scoutsEnvironmentSchema>;

export const parseScoutsEnvironment = (
    raw: Record<string, unknown>,
    source: string
): ScoutsEnvironment =>
    parseEnvironment(scoutsEnvironmentSchema, raw, {
        project: 'scouts',
        source,
        examplePath: 'apps/scouts/.env.example',
    });
