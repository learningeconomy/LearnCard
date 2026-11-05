import 'dotenv/config';

import { z } from 'zod';
import {
    DEFAULT_SKILL_EMBEDDING_DIMENSION,
    DEFAULT_SKILL_EMBEDDING_REGION,
    DEFAULT_SKILL_EMBEDDING_TIMEOUT_MS,
    DEPLOYED_SKILL_EMBEDDING_ALLOWLIST,
    NOVA2_EMBEDDING_MODEL_ID,
    isDeployedRuntime,
    isNova2EmbeddingModelId,
    isSupportedSkillEmbeddingDimension,
} from './skillEmbedding';
import {
    environmentPort,
    optionalEnvironmentBoolean,
    optionalEnvironmentPort,
    optionalEnvironmentString,
    optionalEnvironmentUrl,
    parseEnvironment,
    requiredEnvironmentString,
} from '@learncard/helpers';

const optionalPositiveInteger = z.preprocess(
    value => (value === '' || value === undefined ? undefined : value),
    z.coerce.number().int().positive().optional()
);

const credentialRefreshNotificationWindowHours = z.preprocess(
    value => (value === '' || value === undefined ? undefined : value),
    z.coerce.number().finite().positive().default(24)
);

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
    SIGNING_AUTHORITY_ENDPOINT: optionalEnvironmentUrl,
    APP_STORE_ADMIN_PROFILE_IDS: optionalEnvironmentString,
    CAMPAIGN_ADMIN_PROFILE_IDS: optionalEnvironmentString,
    CAMPAIGN_QUEUE_URL: optionalEnvironmentUrl,
    CAMPAIGN_DISPATCH_PAGE_SIZE: z.preprocess(
        value => (value === '' ? undefined : value),
        z.coerce.number().int().min(1).max(1000).default(1000)
    ),
    CAMPAIGN_DISPATCH_DELAY_SECONDS: z.preprocess(
        value => (value === '' ? undefined : value),
        z.coerce.number().int().min(0).max(900).default(60)
    ),
    SKILL_FRAMEWORK_ADMIN_PROFILE_IDS: optionalEnvironmentString,
    SKILL_FRAMEWORK_SEED_OWNER_PROFILE_ID: optionalEnvironmentString,
    TRUSTED_BRAIN_SERVICES: optionalEnvironmentString,
    TRUSTED_ISSUERS_WHITELIST: optionalEnvironmentString,
    OIDC_TRUSTED_ISSUERS: optionalEnvironmentString,
    OIDC_EXPECTED_AUDIENCE: optionalEnvironmentString,
    AWS_REGION: optionalEnvironmentString,
    NOTIFICATIONS_QUEUE_URL: optionalEnvironmentUrl,
    INBOX_QUEUE_URL: optionalEnvironmentUrl,
    INBOX_DEAD_LETTER_QUEUE_URL: optionalEnvironmentUrl,
    INBOX_QUEUE_ENDPOINT: optionalEnvironmentUrl,
    NOTIFICATIONS_QUEUE_POLL_URL: optionalEnvironmentUrl,
    NOTIFICATIONS_SERVICE_WEBHOOK_URL: optionalEnvironmentUrl.or(z.literal('false')),
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
    // LC-2206 legacy path: Google gemini-embedding-001 (768-d). Semantic search reads the legacy
    // index with Google query embeddings while SKILL_EMBEDDING_BEDROCK_READ_ENABLED is off, and
    // skill writes keep the legacy vectors current. Removed by the post-rollback cleanup.
    SKILL_EMBEDDING_GOOGLE_API_KEY: optionalEnvironmentString,
    SKILL_EMBEDDING_GOOGLE_MODEL: optionalEnvironmentString,
    // LC-2206: Amazon Nova 2 embeddings on Bedrock, SigV4 with the execution role only.
    // ENABLED turns on Nova writes (new/updated skills, backfill); READ_ENABLED switches semantic
    // search to the Nova index. Reads default off; flipping READ_ENABLED back off is the rollback.
    SKILL_EMBEDDING_BEDROCK_ENABLED: optionalEnvironmentBoolean.default(false),
    SKILL_EMBEDDING_BEDROCK_READ_ENABLED: optionalEnvironmentBoolean.default(false),
    SKILL_EMBEDDING_BEDROCK_MODEL_ID: optionalEnvironmentString,
    SKILL_EMBEDDING_BEDROCK_REGION: optionalEnvironmentString,
    SKILL_EMBEDDING_DIMENSION: optionalPositiveInteger,
    SKILL_EMBEDDING_BEDROCK_TIMEOUT_MS: optionalPositiveInteger,
    SKILL_EMBEDDING_CONCURRENCY: optionalPositiveInteger,
    // Read only to refuse ambient overrides in deployed runtimes; never used to authenticate.
    AWS_ENDPOINT_URL: optionalEnvironmentString,
    AWS_ENDPOINT_URL_BEDROCK_RUNTIME: optionalEnvironmentString,
    AWS_BEARER_TOKEN_BEDROCK: optionalEnvironmentString,
    SKILL_EMBEDDING_CACHE_TTL_SECONDS: optionalEnvironmentPort,
    SKILL_EMBEDDING_BATCH_SIZE: optionalEnvironmentPort,
    SKILL_EMBEDDING_BACKFILL_BATCH_SIZE: optionalEnvironmentPort,
    SKILL_EMBEDDING_BACKFILL_LOCK_TTL_SECONDS: optionalEnvironmentPort,
    SKILL_EMBEDDING_BACKFILL_PAGE_SIZE: optionalEnvironmentPort,
    SKILL_SEMANTIC_SEARCH_RATE_LIMIT_PER_MIN: optionalEnvironmentPort,
    BITSTRING_STATUS_LIST_SIZE: optionalEnvironmentPort,
    CREDENTIAL_REFRESH_DIGEST_SECRET: optionalEnvironmentString,
    SHARE_LINK_REQUEST_HASH_SECRET: optionalEnvironmentString,
    CREDENTIAL_REFRESH_ENABLED: optionalEnvironmentBoolean.default(false),
    CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS: credentialRefreshNotificationWindowHours,
    IS_OFFLINE: optionalEnvironmentBoolean.default(false),
    IS_CI: optionalEnvironmentBoolean.default(false),
    IS_E2E_TEST: optionalEnvironmentBoolean.default(false),
    INBOX_DELETE_EXPIRED_RECORDS: optionalEnvironmentBoolean.default(false),
    INBOX_BATCH_ITEMS_PER_HOUR: optionalEnvironmentString,
    AWS_LAMBDA_FUNCTION_NAME: optionalEnvironmentString,
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
} satisfies z.ZodRawShape;

type SkillEmbeddingEnvironment = {
    NODE_ENV: string;
    IS_OFFLINE: boolean;
    AWS_LAMBDA_FUNCTION_NAME?: string;
    SKILL_EMBEDDING_BEDROCK_ENABLED: boolean;
    SKILL_EMBEDDING_BEDROCK_READ_ENABLED: boolean;
    SKILL_EMBEDDING_BACKFILL_ON_STARTUP: boolean;
    SKILL_EMBEDDING_BEDROCK_MODEL_ID: string;
    SKILL_EMBEDDING_BEDROCK_REGION: string;
    SKILL_EMBEDDING_DIMENSION: number;
    AWS_ENDPOINT_URL?: string;
    AWS_ENDPOINT_URL_BEDROCK_RUNTIME?: string;
    AWS_BEARER_TOKEN_BEDROCK?: string;
};

/**
 * LC-2206 startup guard. Any model or dimension that Nova 2 cannot serve is always rejected;
 * deployed runtimes (staging and production) additionally only accept the reviewed allowlist,
 * and refuse endpoint overrides and long-term Bedrock API keys.
 */
export const refineSkillEmbeddingEnvironment = (
    environment: SkillEmbeddingEnvironment,
    context: z.RefinementCtx
): void => {
    const modelId = environment.SKILL_EMBEDDING_BEDROCK_MODEL_ID;
    const dimension = environment.SKILL_EMBEDDING_DIMENSION;
    const region = environment.SKILL_EMBEDDING_BEDROCK_REGION;

    if (!isNova2EmbeddingModelId(modelId)) {
        context.addIssue({
            code: 'custom',
            path: ['SKILL_EMBEDDING_BEDROCK_MODEL_ID'],
            message: 'Must be an Amazon Nova 2 multimodal embeddings model ID',
        });
    }

    if (!isSupportedSkillEmbeddingDimension(dimension)) {
        context.addIssue({
            code: 'custom',
            path: ['SKILL_EMBEDDING_DIMENSION'],
            message: 'Must be one of 256, 384, 1024 or 3072',
        });
    }

    if (
        environment.SKILL_EMBEDDING_BACKFILL_ON_STARTUP &&
        !environment.SKILL_EMBEDDING_BEDROCK_ENABLED
    ) {
        context.addIssue({
            code: 'custom',
            path: ['SKILL_EMBEDDING_BEDROCK_ENABLED'],
            message: 'Required when SKILL_EMBEDDING_BACKFILL_ON_STARTUP=true',
        });
    }

    // Nova query embeddings need Bedrock; reading the Nova index without it would fail every search.
    if (
        environment.SKILL_EMBEDDING_BEDROCK_READ_ENABLED &&
        !environment.SKILL_EMBEDDING_BEDROCK_ENABLED
    ) {
        context.addIssue({
            code: 'custom',
            path: ['SKILL_EMBEDDING_BEDROCK_ENABLED'],
            message: 'Required when SKILL_EMBEDDING_BEDROCK_READ_ENABLED=true',
        });
    }

    if (!isDeployedRuntime(environment)) return;

    const allowlist = DEPLOYED_SKILL_EMBEDDING_ALLOWLIST;

    if (!(allowlist.modelIds as readonly string[]).includes(modelId)) {
        context.addIssue({
            code: 'custom',
            path: ['SKILL_EMBEDDING_BEDROCK_MODEL_ID'],
            message: `Deployed runtimes only allow ${allowlist.modelIds.join(', ')}`,
        });
    }

    if (!(allowlist.dimensions as readonly number[]).includes(dimension)) {
        context.addIssue({
            code: 'custom',
            path: ['SKILL_EMBEDDING_DIMENSION'],
            message: `Deployed runtimes only allow ${allowlist.dimensions.join(', ')}`,
        });
    }

    if (!(allowlist.regions as readonly string[]).includes(region)) {
        context.addIssue({
            code: 'custom',
            path: ['SKILL_EMBEDDING_BEDROCK_REGION'],
            message: `Deployed runtimes only allow ${allowlist.regions.join(', ')}`,
        });
    }

    if (!environment.SKILL_EMBEDDING_BEDROCK_ENABLED) return;

    for (const key of ['AWS_ENDPOINT_URL', 'AWS_ENDPOINT_URL_BEDROCK_RUNTIME'] as const) {
        if (environment[key]) {
            context.addIssue({
                code: 'custom',
                path: [key],
                message: 'Bedrock endpoint overrides are not allowed in deployed runtimes',
            });
        }
    }

    if (environment.AWS_BEARER_TOKEN_BEDROCK) {
        context.addIssue({
            code: 'custom',
            path: ['AWS_BEARER_TOKEN_BEDROCK'],
            message: 'Skill embeddings use the execution role (SigV4), not Bedrock API keys',
        });
    }
};

export const brainServiceEnvironmentSchema = z
    .object(brainServiceEnvironmentShape)
    .transform(environment => ({
        ...environment,
        NOTIFICATIONS_SERVICE_PORT: environment.NOTIFICATIONS_SERVICE_PORT ?? 5100,
        CLIENT_APP_PORT: environment.CLIENT_APP_PORT ?? 3000,
        SKILL_EMBEDDING_BEDROCK_MODEL_ID:
            environment.SKILL_EMBEDDING_BEDROCK_MODEL_ID ?? NOVA2_EMBEDDING_MODEL_ID,
        SKILL_EMBEDDING_BEDROCK_REGION:
            environment.SKILL_EMBEDDING_BEDROCK_REGION ?? DEFAULT_SKILL_EMBEDDING_REGION,
        SKILL_EMBEDDING_DIMENSION:
            environment.SKILL_EMBEDDING_DIMENSION ?? DEFAULT_SKILL_EMBEDDING_DIMENSION,
        SKILL_EMBEDDING_BEDROCK_TIMEOUT_MS: Math.min(
            Math.max(
                environment.SKILL_EMBEDDING_BEDROCK_TIMEOUT_MS ??
                    DEFAULT_SKILL_EMBEDDING_TIMEOUT_MS,
                1_000
            ),
            60_000
        ),
        SKILL_EMBEDDING_CONCURRENCY: Math.min(environment.SKILL_EMBEDDING_CONCURRENCY ?? 1, 8),
    }))
    .superRefine((environment, context) => {
        refineSkillEmbeddingEnvironment(environment, context);

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
            environment.NODE_ENV !== 'test' &&
            environment.CREDENTIAL_REFRESH_ENABLED &&
            !environment.CREDENTIAL_REFRESH_DIGEST_SECRET
        ) {
            context.addIssue({
                code: 'custom',
                path: ['CREDENTIAL_REFRESH_DIGEST_SECRET'],
                message: 'Required when CREDENTIAL_REFRESH_ENABLED=true',
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

const credentialRefreshRuntimeEnvironmentSchema = z
    .object({
        NODE_ENV: brainServiceEnvironmentShape.NODE_ENV,
        DOMAIN_NAME: brainServiceEnvironmentShape.DOMAIN_NAME,
        CREDENTIAL_REFRESH_DIGEST_SECRET:
            brainServiceEnvironmentShape.CREDENTIAL_REFRESH_DIGEST_SECRET,
        CREDENTIAL_REFRESH_ENABLED: brainServiceEnvironmentShape.CREDENTIAL_REFRESH_ENABLED,
        CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS:
            brainServiceEnvironmentShape.CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS,
    })
    .superRefine((environment, context) => {
        if (
            environment.NODE_ENV !== 'test' &&
            environment.CREDENTIAL_REFRESH_ENABLED &&
            !environment.CREDENTIAL_REFRESH_DIGEST_SECRET
        ) {
            context.addIssue({
                code: 'custom',
                path: ['CREDENTIAL_REFRESH_DIGEST_SECRET'],
                message: 'Required when CREDENTIAL_REFRESH_ENABLED=true',
            });
        }
    });

export type CredentialRefreshRuntimeEnvironment = z.output<
    typeof credentialRefreshRuntimeEnvironmentSchema
>;

/** Reads refresh settings at call time so tests and local route registration can override them. */
export const getCredentialRefreshRuntimeEnvironment = (): CredentialRefreshRuntimeEnvironment =>
    parseEnvironment(credentialRefreshRuntimeEnvironmentSchema, process.env, {
        project: 'brain-service credential refresh',
        source: 'process environment',
        examplePath: 'services/learn-card-network/brain-service/.env.example',
    });

const shareLinkRequestHashRuntimeEnvironmentSchema = z.object({
    NODE_ENV: brainServiceEnvironmentShape.NODE_ENV,
    SHARE_LINK_REQUEST_HASH_SECRET: brainServiceEnvironmentShape.SHARE_LINK_REQUEST_HASH_SECRET,
});

/** Reads the dedicated fingerprint secret at call time for enabled share-link APIs. */
export const getShareLinkRequestHashRuntimeEnvironment = () =>
    parseEnvironment(shareLinkRequestHashRuntimeEnvironmentSchema, process.env, {
        project: 'brain-service share links',
        source: 'process environment',
        examplePath: 'services/learn-card-network/brain-service/.env.example',
    });

const inboxBatchRuntimeEnvironmentSchema = z.object({
    INBOX_QUEUE_URL: brainServiceEnvironmentShape.INBOX_QUEUE_URL,
    INBOX_DEAD_LETTER_QUEUE_URL: brainServiceEnvironmentShape.INBOX_DEAD_LETTER_QUEUE_URL,
    INBOX_QUEUE_ENDPOINT: brainServiceEnvironmentShape.INBOX_QUEUE_ENDPOINT,
    AWS_REGION: brainServiceEnvironmentShape.AWS_REGION,
    NODE_ENV: brainServiceEnvironmentShape.NODE_ENV,
    IS_OFFLINE: brainServiceEnvironmentShape.IS_OFFLINE,
    AWS_LAMBDA_FUNCTION_NAME: brainServiceEnvironmentShape.AWS_LAMBDA_FUNCTION_NAME,
    INBOX_BATCH_ITEMS_PER_HOUR: brainServiceEnvironmentShape.INBOX_BATCH_ITEMS_PER_HOUR,
});

export type InboxBatchRuntimeEnvironment = z.output<typeof inboxBatchRuntimeEnvironmentSchema>;

/** Reads batch settings at call time so local invocations and tests can override them safely. */
export const getInboxBatchRuntimeEnvironment = (): InboxBatchRuntimeEnvironment =>
    parseEnvironment(inboxBatchRuntimeEnvironmentSchema, process.env, {
        project: 'brain-service inbox batch',
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
