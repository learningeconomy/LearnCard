// Empty-string keys still count toward Lambda's 4KB env limit, so emit only set values.
// Enclave keys are gated on ESCROW_ENCLAVE_MODE: unsetting that one variable disables
// escrow without deleting the stored key secret.
const RELAY_KEYS = ['ESCROW_RELAY_URL', 'ESCROW_RELAY_AUTH_TOKEN'];

const ENCLAVE_KEYS = [
    'ESCROW_ENCLAVE_MODE',
    'ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON',
    'ESCROW_ENCLAVE_ACTIVE_KEY_ID',
    'ESCROW_ENCLAVE_REMOTE_URL',
    'ESCROW_ENCLAVE_REMOTE_TOKEN',
    'ESCROW_ENCLAVE_REMOTE_TIMEOUT_MS',
    'ESCROW_RELEASE_KILL_SWITCH',
    'ESCROW_HOLD_DURATION_MS',
    'ESCROW_HOLD_RESTART_MIN_AGE_MS',
];

const pick = keys =>
    Object.fromEntries(keys.filter(key => process.env[key]).map(key => [key, process.env[key]]));

const escrowKeys = () =>
    process.env.ESCROW_ENCLAVE_MODE ? [...RELAY_KEYS, ...ENCLAVE_KEYS] : RELAY_KEYS;

// Scheduled escrow jobs need only escrow settings, not request-auth config.
exports.escrow = () => pick(escrowKeys());

exports.api = () => {
    const keys = escrowKeys();
    return pick([
        ...keys,
        'KEYCLOAK_ISSUERS',
        'KEYCLOAK_AUDIENCES',
        'KEYCLOAK_JWKS_URL_OVERRIDES',
        'GOOGLE_OAUTH_CLIENT_IDS',
        'APPLE_OAUTH_CLIENT_IDS',
        process.env.RUNTIME_SECRETS_ID ? 'RUNTIME_SECRETS_ID' : 'GOOGLE_APPLICATION_CREDENTIAL',
    ]);
};

// Audiences ride along so the shared schema can reject issuers without audiences at startup.
exports.oidc = () =>
    pick([
        'KEYCLOAK_ISSUERS',
        'KEYCLOAK_AUDIENCES',
        'OIDC_ISSUER',
        'OIDC_CLIENT_ID',
        'OIDC_CLIENT_SECRET',
        'OIDC_REDIRECT_URIS',
        'OIDC_SIGNING_KEY_SECRET_ID',
    ]);
