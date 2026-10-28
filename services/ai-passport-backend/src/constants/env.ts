import {
    AiProviderConfigError,
    validateAiProviderEnvironment,
    type AiProviderConfig,
} from '../ai/ai-provider-config';
import { writePrivacyGuardrailBypassBanner } from '../ai/privacy-guardrail-bypass';
import { validateProductionSigningPolicy } from './signingPolicy';

// API Keys and credentials
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
export const SEED = process.env.SEED || '';
// Separate from authentication secrets; missing material disables AI processing.
export const AI_PRIVACY_KEY = process.env.AI_PRIVACY_KEY || '';
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const AI_PRIVACY_PYTHON = process.env.AI_PRIVACY_PYTHON || 'python3';
export const AI_PRIVACY_ASSET_DIR = process.env.AI_PRIVACY_ASSET_DIR || '';
export const AI_PRIVACY_OCR_LANGUAGES =
    process.env.AI_PRIVACY_OCR_LANGUAGES ||
    'eng+spa+fra+deu+por+ita+ara+rus+hin+chi_sim+chi_tra+jpn+kor';
export const AI_LOCAL_DEBUG_LOGGING = process.env.AI_LOCAL_DEBUG_LOGGING === 'true';

// LearnCard integration
export const LEARNCARD_CONTRACT_URI =
    process.env.LEARNCARD_CONTRACT_URI ||
    'lc:network:network.learncard.com/trpc:contract:fd6649c7-52c9-4d02-b5ab-fade649d5a0b';

export const LEARNCARD_DID_WEB =
    process.env.LEARNCARD_DID_WEB || 'did:web:network.learncard.com:users:ai-passport';
export const LEARNCARD_NETWORK_URL =
    process.env.LEARNCARD_NETWORK_URL || 'https://network.learncard.com/trpc';
export const LEARNCARD_CLOUD_URL =
    process.env.LEARNCARD_CLOUD_URL || 'https://cloud.learncard.com/trpc';

export const parsePositiveInteger = (value: string | undefined, fallback: number): number => {
    const parsed = Number(value);

    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

// Server configuration
export const PORT = Number.parseInt(process.env.PORT || '3001', 10);
export const parseCorsOrigins = (value: string | undefined): string[] => {
    const origins = value
        ? value
              .split(',')
              .map(origin => origin.trim())
              .filter(Boolean)
        : ['http://localhost:3000', 'http://localhost:4321'];

    if (origins.includes('*')) {
        throw new Error('CORS_ORIGINS cannot contain * when credentialed requests are enabled');
    }

    return origins;
};

export const CORS_ORIGINS = parseCorsOrigins(process.env.CORS_ORIGINS);
export const JWT_SECRET = process.env.JWT_SECRET || (NODE_ENV === 'production' ? '' : SEED);
export const AUTH_SESSION_HANDOFF_TTL_SECONDS = parsePositiveInteger(
    process.env.AUTH_SESSION_HANDOFF_TTL_SECONDS,
    60
);
export const AUTH_CHALLENGE_TTL_SECONDS = parsePositiveInteger(
    process.env.AUTH_CHALLENGE_TTL_SECONDS,
    5 * 60
);
export const AUTH_WEBSOCKET_TICKET_TTL_SECONDS = parsePositiveInteger(
    process.env.AUTH_WEBSOCKET_TICKET_TTL_SECONDS,
    45
);
export const AUTH_SESSION_TTL_SECONDS = parsePositiveInteger(
    process.env.AUTH_SESSION_TTL_SECONDS,
    7 * 24 * 60 * 60
);
export const DOMAIN = process.env.DOMAIN || `http://localhost:${PORT}`;
export const LCA_URL = process.env.LCA_URL || 'https://learncard.app';
// LearnCard service-identity bounds. A hung or rejected network call must not
// hold a session past its context budget, and a failed init must not be retried
// on every call.
export const LEARNCARD_INIT_TIMEOUT_MS = parsePositiveInteger(
    process.env.LEARNCARD_INIT_TIMEOUT_MS,
    10_000
);
export const LEARNCARD_CALL_TIMEOUT_MS = parsePositiveInteger(
    process.env.LEARNCARD_CALL_TIMEOUT_MS,
    5_000
);
export const LEARNCARD_INIT_FAILURE_BACKOFF_MS = parsePositiveInteger(
    process.env.LEARNCARD_INIT_FAILURE_BACKOFF_MS,
    5_000
);
export const CREDENTIAL_PRELOAD_CONCURRENCY = Math.min(
    16,
    parsePositiveInteger(process.env.CREDENTIAL_PRELOAD_CONCURRENCY, 4)
);
export const SESSION_CONTEXT_BUDGET_MS = parsePositiveInteger(
    process.env.SESSION_CONTEXT_BUDGET_MS,
    2000
);
export const SESSION_PLAN_TIMEOUT_MS = parsePositiveInteger(
    process.env.SESSION_PLAN_TIMEOUT_MS,
    30000
);
export const SESSION_FIRST_MODULE_CONTEXT_WAIT_MS = parsePositiveInteger(
    process.env.SESSION_FIRST_MODULE_CONTEXT_WAIT_MS,
    1500
);
export const CREDENTIAL_INGESTION_STARTUP_WAIT_MS = parsePositiveInteger(
    process.env.CREDENTIAL_INGESTION_STARTUP_WAIT_MS,
    2_000
);

const parsedCredentialRelevanceScore = Number(process.env.CREDENTIAL_RELEVANCE_MIN_AVERAGE_SCORE);
export const CREDENTIAL_RELEVANCE_MIN_AVERAGE_SCORE =
    Number.isFinite(parsedCredentialRelevanceScore) &&
    parsedCredentialRelevanceScore >= -1 &&
    parsedCredentialRelevanceScore <= 1
        ? parsedCredentialRelevanceScore
        : 0.2;
const parsedCredentialStrongScore = Number(process.env.CREDENTIAL_RELEVANCE_STRONG_SCORE);
export const CREDENTIAL_RELEVANCE_STRONG_SCORE =
    Number.isFinite(parsedCredentialStrongScore) &&
    parsedCredentialStrongScore >= -1 &&
    parsedCredentialStrongScore <= 1
        ? parsedCredentialStrongScore
        : 0.82;
export const CREDENTIAL_RELEVANCE_MIN_MATCHES = Math.min(
    5,
    parsePositiveInteger(process.env.CREDENTIAL_RELEVANCE_MIN_MATCHES, 3)
);

// Redis configuration
const rawRedisPort = process.env.REDIS_PORT;
export const REDIS_HOST = process.env.REDIS_HOST;
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
export const REDIS_PORT = rawRedisPort ? Number.parseInt(rawRedisPort, 10) : undefined;

// Qdrant configuration
export const QDRANT_HOST = process.env.QDRANT_HOST || 'localhost';
export const QDRANT_PORT = Number.parseInt(process.env.QDRANT_PORT || '6333', 10);
export const QDRANT_HTTPS = process.env.QDRANT_HTTPS === 'true';
export const QDRANT_API_KEY = process.env.QDRANT_API_KEY;

// AI Model configuration
export const CHAT_MODEL = process.env.CHAT_MODEL || 'gpt-6.1-sol';
export const PLANNING_MODEL = process.env.PLANNING_MODEL || 'gpt-6.1-sol';
export const FORMATTING_MODEL = process.env.FORMATTING_MODEL || 'gpt-6-luna-none';
export const TITLE_MODEL = process.env.TITLE_MODEL || 'gpt-6-luna-none';
export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
// First-party/configuration facts only; native gates do not inherit this helper.
// Luna-none role defaults stay explicit; a bare Luna native request omits reasoning.
export const OPENAI_REASONING_EFFORT = process.env.OPENAI_REASONING_EFFORT || undefined;
export const AI_PROVIDER_QUOTA_COOLDOWN_SECONDS = parsePositiveInteger(
    process.env.AI_PROVIDER_QUOTA_COOLDOWN_SECONDS,
    5 * 60
);

const rawMongoUri = process.env.MONGO_URI;
export const MONGO_URI = rawMongoUri || '';
export const MONGO_DB = process.env.MONGO_DB || 'consent_flow_chat';

export const REDIS_PREFIX = process.env.REDIS_PREFIX || 'default';
export const QDRANT_PREFIX = process.env.QDRANT_PREFIX || 'default';

// OpenSyllabus configuration
export const OPEN_SYLLABUS_ANALYTICS_BASE_URL = 'https://api.opensyllabus.org/analytics/v1';
export const OPEN_SYLLABUS_API_KEY = process.env.OPEN_SYLLABUS_API_KEY || '';

// CareerOneStop configuration
export const CAREER_ONE_STOP_CONFIG = process.env.CAREER_ONE_STOP_CONFIG || '';

/** Every startup configuration problem, reported together. */
export class BackendEnvironmentError extends Error {
    constructor(readonly problems: string[]) {
        super(`Invalid backend environment:\n- ${problems.join('\n- ')}`);
        this.name = 'BackendEnvironmentError';
    }
}

export const validateBackendEnvironment = (): AiProviderConfig => {
    validateProductionSigningPolicy({
        nodeEnv: NODE_ENV,
        jwtSecret: JWT_SECRET,
        seed: SEED,
    });
    const missing = [
        !MONGO_URI && 'MONGO_URI',
        !SEED && 'SEED',
        !REDIS_HOST && 'REDIS_HOST',
        (REDIS_PORT === undefined || Number.isNaN(REDIS_PORT)) && 'REDIS_PORT',
    ].filter((name): name is string => Boolean(name));
    const problems = missing.length
        ? [`Missing or invalid required environment variables: ${missing.join(', ')}`]
        : [];

    // LLM_PROVIDER, EMBEDDINGS_PROVIDER, OPENAI_API_KEY, bypass, Bedrock region/auth/models.
    let config: AiProviderConfig | undefined;
    try {
        config = validateAiProviderEnvironment(process.env, {
            CHAT_MODEL,
            PLANNING_MODEL,
            FORMATTING_MODEL,
            TITLE_MODEL,
        });
    } catch (error) {
        if (!(error instanceof AiProviderConfigError)) throw error;
        problems.push(...error.problems);
    }
    if (problems.length || !config) throw new BackendEnvironmentError(problems);
    if (config.privacyGuardrailBypass) writePrivacyGuardrailBypassBanner();
    return config;
};
