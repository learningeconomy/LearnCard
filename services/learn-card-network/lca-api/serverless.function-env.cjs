const { functionEnvironment, pickNonEmpty } = require('@learncard/service-config/function-env.cjs');

const PROVIDER_SECRETS = [
    'SEED',
    'MONGO_URI',
    'MONGO_DB_NAME',
    'AUTHORIZED_DIDS',
    'METABASE_SECRET_KEY',
    'OPENAI_API_KEY',
    'POSTMARK_SERVER_TOKEN',
    'SCOUTS_SSO_CLIENT_SECRET',
    'SENTRY_DSN',
    'LEARN_CLOUD_URL',
];

const API_SECRETS = [
    'GOOGLE_APPLICATION_CREDENTIAL',
    'POSTHOG_API_KEY',
    'ESCROW_RELAY_URL',
    'ESCROW_RELAY_AUTH_TOKEN',
    'ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON',
    'ESCROW_ENCLAVE_REMOTE_URL',
    'ESCROW_ENCLAVE_REMOTE_TOKEN',
    'KEYCLOAK_JWKS_URL_OVERRIDES',
];

// Non-secret operator toggles forwarded in bundle mode too, so enabling RUNTIME_SECRETS_ID
// can never silently change them: escrow stays off unless ESCROW_ENCLAVE_MODE is set, and
// ESCROW_RELEASE_KILL_SWITCH must be flippable without editing the bundle.
const API_TOGGLES = ['ESCROW_ENCLAVE_MODE', 'ESCROW_RELEASE_KILL_SWITCH'];

// Serverless v3 supplies CLI options to file functions and preserves CF intrinsics.
// No stage-file values are forwarded from the deployment environment.
exports.provider = ({ options = {} } = {}) => ({
    LAMBDA_STAGE: options.stage || 'dev',
    // Non-secret product selector for the shared stage files (config.<tenant>.<stage>.json).
    CONFIG_TENANT: process.env.CONFIG_TENANT || 'learncard',
    PORT: String(options.httpPort || '3000'),
    SA_SEED_KMS_KEY_ARN: { 'Fn::GetAtt': ['SigningAuthoritySeedKey', 'Arn'] },
    REDIS_HOST: { 'Fn::GetAtt': ['ElasticCacheCluster', 'RedisEndpoint.Address'] },
    REDIS_PORT: { 'Fn::GetAtt': ['ElasticCacheCluster', 'RedisEndpoint.Port'] },
    ...functionEnvironment({ always: [], fallback: PROVIDER_SECRETS }),
});

// API/migration and the default-role didWeb/swagger functions get the bundle pointer.
// Reading the bundle does not grant the default role signing-authority KMS access.
exports.api = () =>
    functionEnvironment({
        always: ['RUNTIME_SECRETS_ID', ...API_TOGGLES],
        fallback: API_SECRETS,
    });

// Scheduled escrow jobs load the full app (Mongo, Postmark, seed) through lambda.ts, so they
// need the same bundle pointer and escrow settings as the API functions.
exports.escrow = exports.api;

// OIDC has its own signing-key secret and cannot read the runtime bundle.
exports.oidc = () => pickNonEmpty(['OIDC_CLIENT_SECRET', 'OIDC_REDIRECT_URIS']);
