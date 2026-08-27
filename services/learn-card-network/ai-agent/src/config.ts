import type { WebSearchProviderName, WebSearchSafeSearch } from './tools/webSearch';

export interface ServiceConfig {
    nodeEnv: string;
    model: string;
    openAIApiKey?: string;
    port: number;
    trustProxyHops?: number;
    walletSeed?: string;
    cloudUrl?: string;
    networkUrl?: string;
    maxToolRounds: number;
    runTimeoutMs?: number;
    maxOutputTokens?: number;
    maxRunTokens?: number;
    maxRunCostUsd?: number;
    inputTokenCostUsdPerMillion?: number;
    outputTokenCostUsdPerMillion?: number;
    metricsNamespace?: string;
    cloudWatchMetricsEnabled: boolean;
    deploymentId?: string;
    sentryDsn?: string;
    sentryEnvironment?: string;
    sentryRelease?: string;
    sentryTracesSampleRate?: number;
    consentFlowContractUri?: string;
    consentFlowAppUrl: string;
    consentFlowDataPageSize: number;
    consentFlowDataMaxPages: number;
    consentFlowCredentialReadLimit: number;
    mongoUri?: string;
    mongoDbName: string;
    selfImprovementEnabled: boolean;
    retroModel?: string;
    retroMaxTraceChars: number;
    webSearchProvider?: WebSearchProviderName | 'none';
    braveSearchApiKey?: string;
    webSearchDefaultLimit?: number;
    webSearchMaxLimit?: number;
    webSearchCountry?: string;
    webSearchSearchLang?: string;
    webSearchSafeSearch?: WebSearchSafeSearch;
    authDomain?: string;
    authChallengeTtlMs: number;
    encryptionKeyId: string;
    debugEnabled: boolean;
    debugToken?: string;
    autonomyDevEnabled: boolean;
    autonomyDevDids: string[];
    autonomyDevPollIntervalMs: number;
    autonomyDevMaxRunsPerCycle: number;
    autonomyDevLeaseMs: number;
    autonomyLaunchDarklyFlagKey: string;
    launchDarklySdkKey?: string;
    triggerEnabled?: boolean;
    triggerEnvironment?: string;
    triggerSecretKey?: string;
}

const DEFAULT_MONGO_DB_NAME = 'learn-card-ai-agent';
const DEFAULT_LOCAL_MONGO_URI = 'mongodb://localhost:27017';

const readNumber = (value: string | undefined, fallback: number): number => {
    if (!value) return fallback;

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : fallback;
};

const readOptionalNumber = (value: string | undefined): number | undefined => {
    if (!value) return undefined;

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : undefined;
};

const readBoolean = (value: string | undefined, fallback: boolean): boolean => {
    const normalized = value?.trim().toLowerCase();

    if (!normalized) return fallback;
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;

    return fallback;
};

const readString = (value: string | undefined): string | undefined => {
    const trimmed = value?.trim();

    return trimmed || undefined;
};

const readWebSearchProvider = (
    value: string | undefined,
    braveSearchApiKey: string | undefined
): ServiceConfig['webSearchProvider'] => {
    const normalized = readString(value)?.toLowerCase();

    if (normalized === 'brave' || normalized === 'mock' || normalized === 'none') return normalized;

    return braveSearchApiKey ? 'brave' : 'none';
};

const readSafeSearch = (value: string | undefined): WebSearchSafeSearch | undefined => {
    const normalized = readString(value)?.toLowerCase();

    if (normalized === 'off' || normalized === 'moderate' || normalized === 'strict')
        return normalized;

    return undefined;
};

const readList = (value: string | undefined): string[] => [
    ...new Set(
        (value ?? '')
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)
    ),
];

const isValidSentryDsn = (value: string): boolean => {
    try {
        const dsn = new URL(value);

        return (
            ['http:', 'https:'].includes(dsn.protocol) &&
            Boolean(dsn.username) &&
            Boolean(dsn.hostname) &&
            dsn.pathname !== '/'
        );
    } catch {
        return false;
    }
};
export const assertAutonomousExecutionConfig = (config: ServiceConfig): void => {
    if (!config.mongoUri) {
        throw new Error('AI_AGENT_MONGO_URI or MONGO_URI must be set for autonomous execution.');
    }
    if (!config.walletSeed) {
        throw new Error('AI_AGENT_WALLET_SEED must be set for autonomous execution.');
    }
    if (!config.openAIApiKey) {
        throw new Error('OPENAI_API_KEY must be set for autonomous execution.');
    }
    if (!config.selfImprovementEnabled) {
        throw new Error(
            'AI_AGENT_SELF_IMPROVEMENT_ENABLED=true is required for autonomous execution.'
        );
    }
    if (!Number.isFinite(config.autonomyDevLeaseMs) || config.autonomyDevLeaseMs < 10_000) {
        throw new Error('AI_AGENT_AUTONOMY_DEV_LEASE_MS must be at least 10000.');
    }
};

export const assertAutonomyDevConfig = (config: ServiceConfig): void => {
    if (!config.autonomyDevEnabled) {
        throw new Error('AI_AGENT_AUTONOMY_DEV_ENABLED=true is required for the autonomy worker.');
    }
    if (config.nodeEnv !== 'development') {
        throw new Error('AI Agent autonomy worker can only run in development.');
    }
    if (config.autonomyDevDids.length === 0) {
        throw new Error('AI_AGENT_AUTONOMY_DEV_DIDS must include at least one fixture DID.');
    }
    assertAutonomousExecutionConfig(config);
    if (
        !Number.isFinite(config.autonomyDevPollIntervalMs) ||
        config.autonomyDevPollIntervalMs < 1_000
    ) {
        throw new Error('AI_AGENT_AUTONOMY_DEV_POLL_INTERVAL_MS must be at least 1000.');
    }
    if (
        !Number.isInteger(config.autonomyDevMaxRunsPerCycle) ||
        config.autonomyDevMaxRunsPerCycle < 1 ||
        config.autonomyDevMaxRunsPerCycle > 10
    ) {
        throw new Error(
            'AI_AGENT_AUTONOMY_DEV_MAX_RUNS_PER_CYCLE must be an integer from 1 to 10.'
        );
    }
    if (
        !Number.isFinite(config.autonomyDevLeaseMs) ||
        config.autonomyDevLeaseMs <= config.autonomyDevPollIntervalMs
    ) {
        throw new Error('AI_AGENT_AUTONOMY_DEV_LEASE_MS must exceed the poll interval.');
    }
};

export const assertTriggerConfig = (config: ServiceConfig): void => {
    if (!config.triggerEnabled) {
        throw new Error('AI_AGENT_TRIGGER_ENABLED=true is required for Trigger.dev schedules.');
    }

    const triggerEnvironment = config.triggerEnvironment?.trim().toLowerCase();
    const isDevelopment = config.nodeEnv === 'development' && triggerEnvironment === 'dev';
    const isStaging =
        config.nodeEnv === 'production' &&
        config.sentryEnvironment === 'staging' &&
        triggerEnvironment === 'staging';

    if (!isDevelopment && !isStaging) {
        throw new Error(
            'Trigger.dev autonomous execution is restricted to development or the staging deployment.'
        );
    }
    if (!config.triggerSecretKey) {
        throw new Error('TRIGGER_SECRET_KEY must be set for Trigger.dev schedules.');
    }
    if (!triggerEnvironment) {
        throw new Error('AI_AGENT_TRIGGER_ENVIRONMENT must identify the Trigger.dev environment.');
    }
    if (isDevelopment && config.autonomyDevDids.length === 0) {
        throw new Error('AI_AGENT_AUTONOMY_DEV_DIDS must include at least one local test DID.');
    }
    if (isStaging && !config.launchDarklySdkKey) {
        throw new Error('LAUNCHDARKLY_SDK_KEY must be set for staging Trigger.dev schedules.');
    }

    assertAutonomousExecutionConfig(config);
};

export const assertSecurityConfig = (config: ServiceConfig): void => {
    const trustProxyHops = config.trustProxyHops ?? 0;

    if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0 || trustProxyHops > 10) {
        throw new Error('AI_AGENT_TRUST_PROXY_HOPS must be an integer from 0 to 10.');
    }

    if (
        !Number.isInteger(config.maxToolRounds) ||
        config.maxToolRounds < 1 ||
        config.maxToolRounds > 20
    ) {
        throw new Error('AI_AGENT_MAX_TOOL_ROUNDS must be an integer from 1 to 20.');
    }
    if (
        config.runTimeoutMs !== undefined &&
        (!Number.isFinite(config.runTimeoutMs) ||
            config.runTimeoutMs < 5_000 ||
            config.runTimeoutMs > 600_000)
    ) {
        throw new Error('AI_AGENT_RUN_TIMEOUT_MS must be between 5000 and 600000.');
    }
    if (
        config.maxOutputTokens !== undefined &&
        (!Number.isInteger(config.maxOutputTokens) ||
            config.maxOutputTokens < 128 ||
            config.maxOutputTokens > 16_384)
    ) {
        throw new Error('AI_AGENT_MAX_OUTPUT_TOKENS must be an integer from 128 to 16384.');
    }
    if (
        config.maxRunTokens !== undefined &&
        (!Number.isInteger(config.maxRunTokens) ||
            config.maxRunTokens < 1_000 ||
            config.maxRunTokens > 1_000_000)
    ) {
        throw new Error('AI_AGENT_MAX_RUN_TOKENS must be an integer from 1000 to 1000000.');
    }
    if (
        config.maxRunCostUsd !== undefined &&
        (!Number.isFinite(config.maxRunCostUsd) || config.maxRunCostUsd <= 0)
    ) {
        throw new Error('AI_AGENT_MAX_RUN_COST_USD must be greater than 0.');
    }
    if (
        config.inputTokenCostUsdPerMillion !== undefined &&
        (!Number.isFinite(config.inputTokenCostUsdPerMillion) ||
            config.inputTokenCostUsdPerMillion < 0)
    ) {
        throw new Error('AI_AGENT_INPUT_TOKEN_COST_USD_PER_MILLION must be at least 0.');
    }
    if (
        config.outputTokenCostUsdPerMillion !== undefined &&
        (!Number.isFinite(config.outputTokenCostUsdPerMillion) ||
            config.outputTokenCostUsdPerMillion < 0)
    ) {
        throw new Error('AI_AGENT_OUTPUT_TOKEN_COST_USD_PER_MILLION must be at least 0.');
    }
    if (
        config.sentryTracesSampleRate !== undefined &&
        (!Number.isFinite(config.sentryTracesSampleRate) ||
            config.sentryTracesSampleRate < 0 ||
            config.sentryTracesSampleRate > 1)
    ) {
        throw new Error('SENTRY_TRACES_SAMPLE_RATE must be between 0 and 1.');
    }

    if (config.nodeEnv === 'production' && !config.authDomain) {
        throw new Error('AI_AGENT_AUTH_DOMAIN must be set in production.');
    }

    if (config.nodeEnv === 'production' && !config.mongoUri) {
        throw new Error('AI_AGENT_MONGO_URI or MONGO_URI must be set in production.');
    }

    if (config.nodeEnv === 'production' && !config.openAIApiKey) {
        throw new Error('OPENAI_API_KEY must be set in production.');
    }

    if (
        config.nodeEnv === 'production' &&
        (!config.cloudUrl || !config.networkUrl || !config.consentFlowContractUri)
    ) {
        throw new Error(
            'AI_AGENT_CLOUD_URL, AI_AGENT_NETWORK_URL, and AI_AGENT_CONSENT_FLOW_CONTRACT_URI must be set in production.'
        );
    }

    if (
        config.nodeEnv === 'production' &&
        (!config.inputTokenCostUsdPerMillion ||
            config.inputTokenCostUsdPerMillion <= 0 ||
            !config.outputTokenCostUsdPerMillion ||
            config.outputTokenCostUsdPerMillion <= 0)
    ) {
        throw new Error(
            'AI_AGENT_INPUT_TOKEN_COST_USD_PER_MILLION and AI_AGENT_OUTPUT_TOKEN_COST_USD_PER_MILLION must be set to current positive prices in production.'
        );
    }

    if (config.nodeEnv === 'production' && !config.sentryDsn) {
        throw new Error('SENTRY_DSN must be set in production.');
    }
    if (config.sentryDsn && !isValidSentryDsn(config.sentryDsn)) {
        throw new Error('SENTRY_DSN must be a raw Sentry DSN URL.');
    }

    if (config.webSearchProvider === 'brave' && !config.braveSearchApiKey) {
        throw new Error(
            'BRAVE_SEARCH_API_KEY must be set when AI_AGENT_WEB_SEARCH_PROVIDER=brave.'
        );
    }

    if (config.nodeEnv === 'production' && config.debugEnabled) {
        throw new Error('AI_AGENT_DEBUG_ENABLED must be false in production.');
    }

    if (config.mongoUri && !config.walletSeed) {
        throw new Error(
            'AI_AGENT_WALLET_SEED, LEARNCARD_AGENT_SEED, or SEED must be set when Mongo persistence is configured because AI Agent Mongo data is encrypted with the agent LearnCard DID.'
        );
    }

    if (config.autonomyDevEnabled && config.triggerEnabled) {
        throw new Error(
            'AI_AGENT_AUTONOMY_DEV_ENABLED and AI_AGENT_TRIGGER_ENABLED cannot both be true.'
        );
    }

    if (config.autonomyDevEnabled) assertAutonomyDevConfig(config);
    if (config.triggerEnabled) assertTriggerConfig(config);
};

export const getConfig = (): ServiceConfig => {
    const nodeEnv = readString(process.env.NODE_ENV) ?? 'development';
    const model = readString(process.env.AI_AGENT_MODEL) ?? 'gpt-5.6-luna';
    const walletSeed =
        readString(process.env.AI_AGENT_WALLET_SEED) ??
        readString(process.env.LEARNCARD_AGENT_SEED) ??
        readString(process.env.SEED);
    const autonomyDevEnabled = readBoolean(process.env.AI_AGENT_AUTONOMY_DEV_ENABLED, false);
    const explicitMongoUri =
        readString(process.env.AI_AGENT_MONGO_URI) ?? readString(process.env.MONGO_URI);
    const mongoUri =
        explicitMongoUri ??
        (!autonomyDevEnabled && nodeEnv !== 'production' && walletSeed
            ? DEFAULT_LOCAL_MONGO_URI
            : undefined);
    const selfImprovementEnabled = readBoolean(
        process.env.AI_AGENT_SELF_IMPROVEMENT_ENABLED,
        nodeEnv !== 'production'
    );
    const braveSearchApiKey = readString(process.env.BRAVE_SEARCH_API_KEY);
    const config: ServiceConfig = {
        nodeEnv,
        model,
        openAIApiKey: readString(process.env.OPENAI_API_KEY),
        port: readNumber(process.env.AI_AGENT_PORT ?? process.env.PORT, 3000),
        trustProxyHops: readNumber(process.env.AI_AGENT_TRUST_PROXY_HOPS, 0),
        walletSeed,
        cloudUrl:
            readString(process.env.AI_AGENT_CLOUD_URL) ?? readString(process.env.LEARN_CLOUD_URL),
        networkUrl:
            readString(process.env.AI_AGENT_NETWORK_URL) ??
            readString(process.env.LEARNCARD_NETWORK_URL),
        maxToolRounds: readNumber(process.env.AI_AGENT_MAX_TOOL_ROUNDS, 8),
        runTimeoutMs: readNumber(process.env.AI_AGENT_RUN_TIMEOUT_MS, 120_000),
        maxOutputTokens: readNumber(process.env.AI_AGENT_MAX_OUTPUT_TOKENS, 4_096),
        maxRunTokens: readNumber(process.env.AI_AGENT_MAX_RUN_TOKENS, 50_000),
        maxRunCostUsd: readNumber(process.env.AI_AGENT_MAX_RUN_COST_USD, 1),
        inputTokenCostUsdPerMillion: readOptionalNumber(
            process.env.AI_AGENT_INPUT_TOKEN_COST_USD_PER_MILLION
        ),
        outputTokenCostUsdPerMillion: readOptionalNumber(
            process.env.AI_AGENT_OUTPUT_TOKEN_COST_USD_PER_MILLION
        ),
        metricsNamespace: readString(process.env.AI_AGENT_METRICS_NAMESPACE) ?? 'LearnCard/AIAgent',
        cloudWatchMetricsEnabled: readBoolean(
            process.env.AI_AGENT_CLOUDWATCH_METRICS_ENABLED,
            false
        ),
        deploymentId: readString(process.env.AI_AGENT_DEPLOYMENT_ID),
        sentryDsn: readString(process.env.SENTRY_DSN),
        sentryEnvironment: readString(process.env.SENTRY_ENV) ?? readString(process.env.NODE_ENV),
        sentryRelease: readString(process.env.SENTRY_RELEASE) ?? readString(process.env.GIT_SHA),
        sentryTracesSampleRate: readOptionalNumber(process.env.SENTRY_TRACES_SAMPLE_RATE),
        consentFlowContractUri: readString(process.env.AI_AGENT_CONSENT_FLOW_CONTRACT_URI),
        consentFlowAppUrl:
            readString(process.env.AI_AGENT_CONSENT_FLOW_APP_URL) ?? 'https://learncard.app',
        consentFlowDataPageSize: readNumber(process.env.AI_AGENT_CONSENT_FLOW_DATA_PAGE_SIZE, 100),
        consentFlowDataMaxPages: readNumber(process.env.AI_AGENT_CONSENT_FLOW_DATA_MAX_PAGES, 10),
        consentFlowCredentialReadLimit: readNumber(
            process.env.AI_AGENT_CONSENT_FLOW_CREDENTIAL_READ_LIMIT,
            50
        ),
        mongoUri,
        mongoDbName:
            readString(process.env.AI_AGENT_MONGO_DB_NAME) ??
            readString(process.env.MONGO_DB_NAME) ??
            DEFAULT_MONGO_DB_NAME,
        selfImprovementEnabled,
        retroModel: readString(process.env.AI_AGENT_RETRO_MODEL) ?? model,
        retroMaxTraceChars: readNumber(process.env.AI_AGENT_RETRO_MAX_TRACE_CHARS, 24_000),
        webSearchProvider: readWebSearchProvider(
            process.env.AI_AGENT_WEB_SEARCH_PROVIDER,
            braveSearchApiKey
        ),
        braveSearchApiKey,
        webSearchDefaultLimit: readNumber(process.env.AI_AGENT_WEB_SEARCH_DEFAULT_LIMIT, 5),
        webSearchMaxLimit: readNumber(process.env.AI_AGENT_WEB_SEARCH_MAX_LIMIT, 10),
        webSearchCountry: readString(process.env.AI_AGENT_WEB_SEARCH_COUNTRY),
        webSearchSearchLang: readString(process.env.AI_AGENT_WEB_SEARCH_LANG),
        webSearchSafeSearch: readSafeSearch(process.env.AI_AGENT_WEB_SEARCH_SAFESEARCH),
        authDomain: readString(process.env.AI_AGENT_AUTH_DOMAIN),
        authChallengeTtlMs: readNumber(process.env.AI_AGENT_AUTH_CHALLENGE_TTL_MS, 300_000),
        encryptionKeyId:
            readString(process.env.AI_AGENT_ENCRYPTION_KEY_ID) ?? 'agent-learncard-dag-jwe-v1',
        debugEnabled: readBoolean(process.env.AI_AGENT_DEBUG_ENABLED, nodeEnv !== 'production'),
        debugToken: readString(process.env.AI_AGENT_DEBUG_TOKEN),
        autonomyDevEnabled,
        autonomyDevDids: readList(process.env.AI_AGENT_AUTONOMY_DEV_DIDS),
        autonomyDevPollIntervalMs: readNumber(
            process.env.AI_AGENT_AUTONOMY_DEV_POLL_INTERVAL_MS,
            30_000
        ),
        autonomyDevMaxRunsPerCycle: readNumber(
            process.env.AI_AGENT_AUTONOMY_DEV_MAX_RUNS_PER_CYCLE,
            3
        ),
        autonomyDevLeaseMs: readNumber(process.env.AI_AGENT_AUTONOMY_DEV_LEASE_MS, 900_000),
        autonomyLaunchDarklyFlagKey:
            readString(process.env.AI_AGENT_AUTONOMY_LAUNCHDARKLY_FLAG_KEY) ??
            'ai-agent-autonomy-enabled',
        launchDarklySdkKey: readString(process.env.LAUNCHDARKLY_SDK_KEY),
        triggerEnabled: readBoolean(process.env.AI_AGENT_TRIGGER_ENABLED, false),
        triggerEnvironment:
            readString(process.env.AI_AGENT_TRIGGER_ENVIRONMENT) ??
            (nodeEnv === 'development' ? 'dev' : nodeEnv),
        triggerSecretKey: readString(process.env.TRIGGER_SECRET_KEY),
    };

    assertSecurityConfig(config);

    return config;
};
