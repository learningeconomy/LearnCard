import 'dotenv/config';

import { z } from 'zod';
import {
    environmentPort,
    optionalEnvironmentBoolean,
    optionalEnvironmentPort,
    optionalEnvironmentString,
    optionalEnvironmentUrl,
    parseEnvironment,
    requiredEnvironmentString,
} from '@learncard/helpers';

export const learnCloudServiceEnvironmentShape = {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: environmentPort.default(3000),
    LEARN_CLOUD_SEED: requiredEnvironmentString,
    LEARN_CLOUD_MONGO_URI: requiredEnvironmentString,
    LEARN_CLOUD_MONGO_DB_NAME: requiredEnvironmentString,
    DOMAIN_NAME: optionalEnvironmentString,
    SERVER_URL: optionalEnvironmentUrl,
    XAPI_ENDPOINT: optionalEnvironmentUrl,
    RSA_PRIVATE_KEY: optionalEnvironmentString,
    RSA_PUBLIC_KEY: optionalEnvironmentString,
    REDIS_HOST: optionalEnvironmentString,
    REDIS_PORT: optionalEnvironmentPort,
    SENTRY_DSN: optionalEnvironmentUrl,
    SENTRY_ENV: optionalEnvironmentString,
    IS_OFFLINE: optionalEnvironmentBoolean.default(false),
    SKIP_DIDKIT_NAPI: optionalEnvironmentBoolean.default(false),
    CI: optionalEnvironmentBoolean.default(false),
} satisfies z.ZodRawShape;

export const learnCloudServiceEnvironmentSchema = z
    .object(learnCloudServiceEnvironmentShape)
    .superRefine((environment, context) => {
        if (
            environment.NODE_ENV === 'production' &&
            !environment.IS_OFFLINE &&
            !environment.DOMAIN_NAME
        ) {
            context.addIssue({
                code: 'custom',
                path: ['DOMAIN_NAME'],
                message: 'Required for a non-offline production deployment',
            });
        }

        const hasPrivateKey = Boolean(environment.RSA_PRIVATE_KEY);
        const hasPublicKey = Boolean(environment.RSA_PUBLIC_KEY);

        if (hasPrivateKey !== hasPublicKey) {
            context.addIssue({
                code: 'custom',
                path: [hasPrivateKey ? 'RSA_PUBLIC_KEY' : 'RSA_PRIVATE_KEY'],
                message: 'RSA_PRIVATE_KEY and RSA_PUBLIC_KEY must be configured together',
            });
        }
    });

export type LearnCloudServiceEnvironment = z.output<typeof learnCloudServiceEnvironmentSchema>;

export const parseLearnCloudServiceEnvironment = (
    raw: Record<string, unknown>,
    source = 'process environment'
): LearnCloudServiceEnvironment => {
    const testDefaults =
        raw.NODE_ENV === 'test'
            ? {
                  LEARN_CLOUD_SEED: 'a'.repeat(64),
                  LEARN_CLOUD_MONGO_URI: 'mongodb://localhost:27017',
                  LEARN_CLOUD_MONGO_DB_NAME: 'learn-cloud-test',
              }
            : {};

    return parseEnvironment(
        learnCloudServiceEnvironmentSchema,
        { ...testDefaults, ...raw },
        {
            project: 'learn-cloud-service',
            source,
            examplePath: 'services/learn-card-network/learn-cloud-service/.env.example',
        }
    );
};

export const environment = parseLearnCloudServiceEnvironment(process.env);
