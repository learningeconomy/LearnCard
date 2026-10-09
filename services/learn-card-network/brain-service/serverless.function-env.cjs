const { functionEnvironment, pickNonEmpty } = require('@learncard/service-config/function-env.cjs');

// User-approved brain-service deployment credentials. In bundle mode these are delivered
// through the runtime-secrets bundle and omitted here; in fallback mode (no bundle) the
// existing per-value GitHub environment secrets are retained. Only genuine credentials
// belong in this list — non-secret allowlists, tuning flags and per-stage values are
// delivered through checked-in stage config at cold start, never forwarded here.
const PROVIDER_SECRETS = [
    'SEED',
    'NEO4J_URI',
    'NEO4J_USERNAME',
    'NEO4J_PASSWORD',
    'POSTMARK_API_KEY',
    'MESSAGEBIRD_AUTH_TOKEN',
    'SENTRY_DSN',
    'POSTHOG_API_KEY',
    'SKILL_EMBEDDING_GOOGLE_API_KEY',
    'SKILLS_PROVIDER_API_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'SMART_RESUME_CLIENT_ID',
    'SMART_RESUME_ACCESS_KEY',
    'SMART_RESUME_CONTRACT_URI',
    'CREDENTIAL_REFRESH_DIGEST_SECRET',
    'SHARE_LINK_REQUEST_HASH_SECRET',
    'APP_STORE_ADMIN_PROFILE_IDS',
    'LOGIN_PROVIDER_DID',
    'NOTIFICATIONS_SERVICE_WEBHOOK_URL',
];

// Serverless v3 supplies CLI options to file functions and recursively resolves the strings
// it returns, so CloudFormation intrinsics (Fn::GetAtt) and construct references survive.
// Every brain-service function shares the one generated execution role, so the bundle pointer
// and the credential fallbacks sit together on the provider. Bundle mode emits only infra plus
// the pointer; fallback mode retains the per-value GitHub secrets. Non-secret per-stage tuning
// and allowlists are applied from checked-in stage config at cold start, never forwarded here.
exports.provider = ({ options = {}, env = process.env } = {}) => ({
    LAMBDA_STAGE: options.stage || 'dev',
    // Non-secret product selector for the shared stage files (config.<tenant>.<stage>.json).
    CONFIG_TENANT: env.CONFIG_TENANT || 'learncard',
    PORT: String(options.httpPort || '3000'),
    REDIS_HOST: { 'Fn::GetAtt': ['ElasticCacheCluster', 'RedisEndpoint.Address'] },
    REDIS_PORT: { 'Fn::GetAtt': ['ElasticCacheCluster', 'RedisEndpoint.Port'] },
    NOTIFICATIONS_QUEUE_URL: '${construct:notifications-queue.queueUrl}',
    INBOX_QUEUE_URL: '${construct:inbox-queue.queueUrl}',
    // The deploy commit, emitted only when set so an empty string never counts toward the
    // 4KB per-function environment limit.
    ...pickNonEmpty(['GIT_SHA'], env),
    ...functionEnvironment({ always: ['RUNTIME_SECRETS_ID'], fallback: PROVIDER_SECRETS, env }),
});
