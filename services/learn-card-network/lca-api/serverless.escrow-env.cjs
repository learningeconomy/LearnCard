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

module.exports = () => {
    const keys = process.env.ESCROW_ENCLAVE_MODE ? [...RELAY_KEYS, ...ENCLAVE_KEYS] : RELAY_KEYS;

    return Object.fromEntries(
        keys.filter(key => process.env[key]).map(key => [key, process.env[key]])
    );
};
