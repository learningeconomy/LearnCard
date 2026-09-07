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

export const lcaApiEnvironmentShape = {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: environmentPort.default(3000),
    SEED: requiredEnvironmentString,
    MONGO_URI: requiredEnvironmentString,
    MONGO_DB_NAME: requiredEnvironmentString,
    DOMAIN_NAME: optionalEnvironmentString,
    AUTHORIZED_DIDS: optionalEnvironmentString,
    LEARN_CLOUD_URL: optionalEnvironmentUrl,
    NETWORK_BRAIN_SERVICE_URL: optionalEnvironmentUrl,
    GOOGLE_APPLICATION_CREDENTIAL: optionalEnvironmentString,
    OPENAI_API_KEY: optionalEnvironmentString,
    METABASE_SECRET_KEY: optionalEnvironmentString,
    SCOUTS_SSO_CLIENT_SECRET: optionalEnvironmentString,
    POSTMARK_SERVER_TOKEN: optionalEnvironmentString,
    POSTMARK_FROM_EMAIL: optionalEnvironmentString,
    POSTMARK_BRAND_NAME: optionalEnvironmentString,
    POSTMARK_LOGIN_CODE_TEMPLATE_ALIAS: optionalEnvironmentString,
    POSTMARK_ENDORSEMENT_REQUEST_TEMPLATE_ALIAS: optionalEnvironmentString,
    POSTMARK_RECOVERY_EMAIL_CODE_TEMPLATE_ALIAS: optionalEnvironmentString,
    POSTMARK_RECOVERY_KEY_TEMPLATE_ALIAS: optionalEnvironmentString,
    ANDROID_PUSH_ICON: optionalEnvironmentString,
    REDIS_HOST: optionalEnvironmentString,
    REDIS_PORT: optionalEnvironmentPort,
    NSO_DASHBOARD_ID: optionalEnvironmentPort,
    GLOBAL_DASHBOARD_ID: optionalEnvironmentPort,
    TROOP_DASHBOARD_ID: optionalEnvironmentPort,
    SENTRY_DSN: optionalEnvironmentUrl,
    SENTRY_ENV: optionalEnvironmentString,
    IS_OFFLINE: optionalEnvironmentBoolean.default(false),
    IS_CI: optionalEnvironmentBoolean.default(false),
    IS_E2E_TEST: optionalEnvironmentBoolean.default(false),
    SKIP_DIDKIT_NAPI: optionalEnvironmentBoolean.default(false),
    CI: optionalEnvironmentBoolean.default(false),
} satisfies z.ZodRawShape;

export const lcaApiEnvironmentSchema = z
    .object(lcaApiEnvironmentShape)
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

        const hasPostmarkToken = Boolean(environment.POSTMARK_SERVER_TOKEN);
        const hasPostmarkSender = Boolean(environment.POSTMARK_FROM_EMAIL);

        if (hasPostmarkToken !== hasPostmarkSender) {
            context.addIssue({
                code: 'custom',
                path: [hasPostmarkToken ? 'POSTMARK_FROM_EMAIL' : 'POSTMARK_SERVER_TOKEN'],
                message:
                    'POSTMARK_SERVER_TOKEN and POSTMARK_FROM_EMAIL must be configured together',
            });
        }
    });

export type LcaApiEnvironment = z.output<typeof lcaApiEnvironmentSchema>;

export const parseLcaApiEnvironment = (
    raw: Record<string, unknown>,
    source = 'process environment'
): LcaApiEnvironment => {
    const testDefaults =
        raw.NODE_ENV === 'test'
            ? {
                  SEED: 'a'.repeat(64),
                  MONGO_URI: 'mongodb://localhost:27017',
                  MONGO_DB_NAME: 'lca-api-test',
              }
            : {};

    return parseEnvironment(
        lcaApiEnvironmentSchema,
        { ...testDefaults, ...raw },
        {
            project: 'lca-api',
            source,
            examplePath: 'services/learn-card-network/lca-api/.env.example',
        }
    );
};

export const environment = parseLcaApiEnvironment(process.env);
