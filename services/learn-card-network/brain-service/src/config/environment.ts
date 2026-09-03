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

export const brainServiceEnvironmentShape = {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: environmentPort.default(3000),
    SEED: requiredEnvironmentString,
    NEO4J_URI: requiredEnvironmentString,
    NEO4J_USERNAME: requiredEnvironmentString,
    NEO4J_PASSWORD: requiredEnvironmentString,
    DOMAIN_NAME: optionalEnvironmentString,
    CLIENT_APP_DOMAIN_NAME: optionalEnvironmentString,
    CLIENT_APP_PORT: optionalEnvironmentPort,
    LOGIN_PROVIDER_DID: optionalEnvironmentString,
    APP_STORE_ADMIN_PROFILE_IDS: optionalEnvironmentString,
    SKILL_FRAMEWORK_ADMIN_PROFILE_IDS: optionalEnvironmentString,
    SKILL_FRAMEWORK_SEED_OWNER_PROFILE_ID: optionalEnvironmentString,
    TRUSTED_BRAIN_SERVICES: optionalEnvironmentString,
    TRUSTED_ISSUERS_WHITELIST: optionalEnvironmentString,
    OIDC_TRUSTED_ISSUERS: optionalEnvironmentString,
    OIDC_EXPECTED_AUDIENCE: optionalEnvironmentString,
    AWS_REGION: optionalEnvironmentString,
    NOTIFICATIONS_QUEUE_URL: optionalEnvironmentUrl,
    NOTIFICATIONS_QUEUE_POLL_URL: optionalEnvironmentUrl,
    NOTIFICATIONS_SERVICE_WEBHOOK_URL: optionalEnvironmentUrl,
    NOTIFICATIONS_SERVICE_PORT: optionalEnvironmentPort,
    BRAIN_SERVICE_REGISTRY_URL: optionalEnvironmentUrl,
    DCC_KNOWN_REGISTRIES_URL: optionalEnvironmentUrl,
    OPENSALT_BASE_URL: optionalEnvironmentUrl,
    OPENSALT_STAGING_BASE_URL: optionalEnvironmentUrl,
    SKILLS_PROVIDER: optionalEnvironmentString,
    SKILLS_PROVIDER_API_KEY: optionalEnvironmentString,
    SKILLS_PROVIDER_BASE_URL: optionalEnvironmentUrl,
    POSTMARK_API_KEY: optionalEnvironmentString,
    POSTMARK_BRAND_NAME: optionalEnvironmentString,
    POSTMARK_FROM_EMAIL: optionalEnvironmentString,
    TWILIO_ACCOUNT_SID: optionalEnvironmentString,
    TWILIO_AUTH_TOKEN: optionalEnvironmentString,
    MESSAGEBIRD_AUTH_TOKEN: optionalEnvironmentString,
    MESSAGEBIRD_ORIGINATOR: optionalEnvironmentString,
    TWILIO_FROM_NUMBER: optionalEnvironmentString,
    SMART_RESUME_ACCESS_KEY: optionalEnvironmentString,
    SMART_RESUME_CLIENT_ID: optionalEnvironmentString,
    SMART_RESUME_CONTRACT_URI: optionalEnvironmentString,
    POSTHOG_API_KEY: optionalEnvironmentString,
    POSTHOG_HOST: optionalEnvironmentUrl,
    REDIS_HOST: optionalEnvironmentString,
    REDIS_PORT: optionalEnvironmentPort,
    GIT_SHA: optionalEnvironmentString,
    SENTRY_DSN: optionalEnvironmentUrl,
    SENTRY_ENV: optionalEnvironmentString,
    SKILL_EMBEDDING_GOOGLE_API_KEY: optionalEnvironmentString,
    SKILL_EMBEDDING_GOOGLE_MODEL: optionalEnvironmentString,
    SKILL_EMBEDDING_CACHE_TTL_SECONDS: optionalEnvironmentPort,
    SKILL_EMBEDDING_BATCH_SIZE: optionalEnvironmentPort,
    SKILL_EMBEDDING_BACKFILL_BATCH_SIZE: optionalEnvironmentPort,
    SKILL_EMBEDDING_BACKFILL_LOCK_TTL_SECONDS: optionalEnvironmentPort,
    SKILL_EMBEDDING_BACKFILL_PAGE_SIZE: optionalEnvironmentPort,
    SKILL_SEMANTIC_SEARCH_RATE_LIMIT_PER_MIN: optionalEnvironmentPort,
    BITSTRING_STATUS_LIST_SIZE: optionalEnvironmentPort,
    IS_OFFLINE: optionalEnvironmentBoolean.default(false),
    IS_CI: optionalEnvironmentBoolean.default(false),
    IS_E2E_TEST: optionalEnvironmentBoolean.default(false),
    ENABLE_BENCH_ROUTES: optionalEnvironmentBoolean.default(false),
    ENABLE_SEND_CREDENTIAL_TELEMETRY: optionalEnvironmentBoolean.default(false),
    LC_PERF_LOG: optionalEnvironmentBoolean.default(false),
    NEO4J_SKIP_INDICES: optionalEnvironmentBoolean.default(false),
    SKILL_EMBEDDING_BACKFILL_ON_STARTUP: optionalEnvironmentBoolean.default(false),
    SKILL_FRAMEWORKS_DEBUG: optionalEnvironmentBoolean.default(false),
    SKIP_DIDKIT_NAPI: optionalEnvironmentBoolean.default(false),
    SKIP_SKILL_FRAMEWORK_SEED: optionalEnvironmentBoolean.default(false),
    TRACE_CONSOLE: optionalEnvironmentBoolean.default(true),
    TRACE_JSON: optionalEnvironmentBoolean.default(false),
    BITSTRING_STATUS_LIST_ALLOW_SMALL: optionalEnvironmentBoolean.default(false),
    AUTHORIZED_SERVICE_DIDS: optionalEnvironmentString,
    INSTALL_INTENT_RECONCILER_SCHEDULER_DISABLED: optionalEnvironmentBoolean.default(false),
    INSTALL_INTENT_RECONCILER_ALLOW_LOCAL_COORDINATION: optionalEnvironmentBoolean,
    INSTALL_INTENT_RECONCILER_DISABLED: optionalEnvironmentBoolean.default(false),
    INSTALL_INTENT_RECONCILER_DISABLED_ECOSYSTEM_IDS: optionalEnvironmentString,
    INSTALL_INTENT_RECONCILER_MAX_RETRIES: optionalEnvironmentString,
    INSTALL_INTENT_RECONCILER_BACKOFF_MS: optionalEnvironmentString,
    INSTALL_INTENT_RECONCILER_STUCK_THRESHOLD_MS: optionalEnvironmentString,
    INSTALL_INTENT_RECONCILER_ALERT_MAX_STUCK_INTENTS: optionalEnvironmentString,
    INSTALL_INTENT_RECONCILER_ALERT_MAX_DEGRADED_INTENTS: optionalEnvironmentString,
    INSTALL_INTENT_RECONCILER_ALERT_MAX_FAILED_INTENTS: optionalEnvironmentString,
    INSTALL_INTENT_RECONCILER_TENANT_CONCURRENCY: optionalEnvironmentString,
    INSTALL_INTENT_RECONCILER_INTERVAL_MS: optionalEnvironmentString,
    INSTALL_INTENT_RECONCILER_HEALTH_INTERVAL_MS: optionalEnvironmentString,
} satisfies z.ZodRawShape;

export const brainServiceEnvironmentSchema = z
    .object(brainServiceEnvironmentShape)
    .transform(environment => ({
        ...environment,
        NOTIFICATIONS_SERVICE_PORT: environment.NOTIFICATIONS_SERVICE_PORT ?? 5100,
        CLIENT_APP_PORT: environment.CLIENT_APP_PORT ?? 3000,
    }))
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

        if (environment.ENABLE_SEND_CREDENTIAL_TELEMETRY && !environment.POSTHOG_API_KEY) {
            context.addIssue({
                code: 'custom',
                path: ['POSTHOG_API_KEY'],
                message: 'Required when ENABLE_SEND_CREDENTIAL_TELEMETRY=true',
            });
        }

        if (
            environment.SKILL_EMBEDDING_BACKFILL_ON_STARTUP &&
            !environment.SKILL_EMBEDDING_GOOGLE_API_KEY
        ) {
            context.addIssue({
                code: 'custom',
                path: ['SKILL_EMBEDDING_GOOGLE_API_KEY'],
                message: 'Required when SKILL_EMBEDDING_BACKFILL_ON_STARTUP=true',
            });
        }
    });

const notificationRuntimeEnvironmentSchema = z
    .object({
        NODE_ENV: brainServiceEnvironmentShape.NODE_ENV,
        DOMAIN_NAME: brainServiceEnvironmentShape.DOMAIN_NAME,
        NOTIFICATIONS_QUEUE_URL: brainServiceEnvironmentShape.NOTIFICATIONS_QUEUE_URL,
        NOTIFICATIONS_SERVICE_WEBHOOK_URL:
            brainServiceEnvironmentShape.NOTIFICATIONS_SERVICE_WEBHOOK_URL,
        NOTIFICATIONS_SERVICE_PORT: brainServiceEnvironmentShape.NOTIFICATIONS_SERVICE_PORT,
        IS_OFFLINE: brainServiceEnvironmentShape.IS_OFFLINE,
        IS_E2E_TEST: brainServiceEnvironmentShape.IS_E2E_TEST,
    })
    .transform(runtimeEnvironment => ({
        ...runtimeEnvironment,
        NOTIFICATIONS_SERVICE_PORT: runtimeEnvironment.NOTIFICATIONS_SERVICE_PORT ?? 5100,
    }));

export type NotificationRuntimeEnvironment = z.output<typeof notificationRuntimeEnvironmentSchema>;

export const getNotificationRuntimeEnvironment = (): NotificationRuntimeEnvironment =>
    parseEnvironment(notificationRuntimeEnvironmentSchema, process.env, {
        project: 'brain-service',
        source: 'process environment',
        examplePath: 'services/learn-card-network/brain-service/.env.example',
    });

export type BrainServiceEnvironment = z.output<typeof brainServiceEnvironmentSchema>;

export const parseBrainServiceEnvironment = (
    raw: Record<string, unknown>,
    source = 'process environment'
): BrainServiceEnvironment => {
    const testDefaults =
        raw.NODE_ENV === 'test'
            ? {
                  SEED: 'a'.repeat(64),
                  NEO4J_URI: 'bolt://localhost:7687',
                  NEO4J_USERNAME: 'neo4j',
                  NEO4J_PASSWORD: 'test-password',
              }
            : {};

    return parseEnvironment(
        brainServiceEnvironmentSchema,
        { ...testDefaults, ...raw },
        {
            project: 'brain-service',
            source,
            examplePath: 'services/learn-card-network/brain-service/.env.example',
        }
    );
};

export const environment = parseBrainServiceEnvironment(process.env);
