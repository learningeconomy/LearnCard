const { functionEnvironment } = require('@learncard/service-config/function-env.cjs');

const PROVIDER_SECRETS = [
    'LEARN_CLOUD_SEED',
    'LEARN_CLOUD_MONGO_URI',
    'LEARN_CLOUD_MONGO_DB_NAME',
    'RSA_PRIVATE_KEY',
    'RSA_PUBLIC_KEY',
    'JWT_SIGNING_KEY',
    'XAPI_ENDPOINT',
    'XAPI_USERNAME',
    'XAPI_PASSWORD',
    'SENTRY_DSN',
];

// Serverless v3 supplies CLI options to file functions and preserves CF intrinsics.
// Every function shares the one generated execution role, so the bundle pointer and the
// credential fallbacks sit together on the provider. Bundle mode emits only infra plus the
// pointer; fallback mode retains the per-value GitHub secrets. XAPI_ENDPOINT is a
// user-classified bundle secret (fallback env only), not infra, so it rides the fallback
// list and is dropped once a bundle is configured. Non-secret per-stage values are applied
// from checked-in stage config at cold start, never forwarded here.
exports.provider = ({ options = {}, env = process.env } = {}) => ({
    LAMBDA_STAGE: options.stage || 'dev',
    // Non-secret product selector for the shared stage files (config.<tenant>.<stage>.json).
    CONFIG_TENANT: env.CONFIG_TENANT || 'learncard',
    PORT: String(options.httpPort || '3000'),
    REDIS_HOST: { 'Fn::GetAtt': ['ElasticCacheCluster', 'RedisEndpoint.Address'] },
    REDIS_PORT: { 'Fn::GetAtt': ['ElasticCacheCluster', 'RedisEndpoint.Port'] },
    ...functionEnvironment({ always: ['RUNTIME_SECRETS_ID'], fallback: PROVIDER_SECRETS, env }),
});
