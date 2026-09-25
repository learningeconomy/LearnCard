import {
    environment,
    parseLcaApiEnvironment,
    parseEscrowPrivateKeys,
    type LcaApiEnvironment,
} from '@environment';
import { SoftwareEnclave } from './softwareEnclave';
import { createRemoteEnclave } from './remoteEnclave';
import { EscrowUnavailableError, type EscrowEnclave } from './types';

export * from './types';
export * from './softwareEnclave';
export * from './remoteEnclave';
export * from './notifications';

let enclave: EscrowEnclave | undefined;
let config: LcaApiEnvironment = environment;

// 'software' config validity is enforced at environment-parse time (see
// config/environment.ts), so reaching that branch always means it's ready.
// 'remote' config (URL/token) is deliberately NOT required at parse time, so
// its readiness is checked here instead; missing it fails this closed rather
// than crashing the whole service at boot.
export const isEscrowEnabled = (): boolean => {
    if (config.ESCROW_ENCLAVE_MODE === 'software') return true;
    if (config.ESCROW_ENCLAVE_MODE === 'remote') {
        return Boolean(config.ESCROW_ENCLAVE_REMOTE_URL && config.ESCROW_ENCLAVE_REMOTE_TOKEN);
    }
    return false;
};
export const isEscrowRemoteMode = (): boolean => config.ESCROW_ENCLAVE_MODE === 'remote';
export const getEscrowHoldDurationMs = (): number => config.ESCROW_HOLD_DURATION_MS;
export const getEscrowHoldRestartMinAgeMs = (): number => config.ESCROW_HOLD_RESTART_MIN_AGE_MS;
export const getEscrowEnclave = (): EscrowEnclave => {
    if (!isEscrowEnabled()) throw new EscrowUnavailableError();
    if (enclave) return enclave;
    if (config.ESCROW_ENCLAVE_MODE === 'software') {
        enclave = new SoftwareEnclave({
            privateKeys: parseEscrowPrivateKeys(
                config.ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON ?? ''
            ),
            activeKeyId: config.ESCROW_ENCLAVE_ACTIVE_KEY_ID ?? '',
        });
        return enclave;
    }
    if (config.ESCROW_ENCLAVE_MODE === 'remote') {
        const { ESCROW_ENCLAVE_REMOTE_URL: baseUrl, ESCROW_ENCLAVE_REMOTE_TOKEN: token } = config;
        if (!baseUrl || !token) throw new EscrowUnavailableError();
        enclave = createRemoteEnclave({
            baseUrl,
            token,
            timeoutMs: config.ESCROW_ENCLAVE_REMOTE_TIMEOUT_MS,
        });
        return enclave;
    }
    throw new EscrowUnavailableError();
};

/** Reset both singleton and environment snapshot after test environment changes. */
export const __setEscrowEnclaveForTests = (replacement: EscrowEnclave | undefined): void => {
    if (environment.NODE_ENV !== 'test') throw new EscrowUnavailableError();
    config = parseLcaApiEnvironment(process.env);
    enclave = replacement;
};
