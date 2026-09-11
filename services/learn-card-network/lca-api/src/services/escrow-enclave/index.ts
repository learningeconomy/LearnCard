import {
    environment,
    parseLcaApiEnvironment,
    parseEscrowPrivateKeys,
    type LcaApiEnvironment,
} from '@environment';
import { SoftwareEnclave } from './softwareEnclave';
import { EscrowUnavailableError, type EscrowEnclave } from './types';

export * from './types';
export * from './softwareEnclave';
export * from './notifications';

let enclave: EscrowEnclave | undefined;
let config: LcaApiEnvironment = environment;

export const isEscrowEnabled = (): boolean => Boolean(config.ESCROW_ENCLAVE_MODE);
export const getEscrowHoldDurationMs = (): number => config.ESCROW_HOLD_DURATION_MS;
export const getEscrowEnclave = (): EscrowEnclave => {
    if (!isEscrowEnabled()) throw new EscrowUnavailableError();
    if (enclave) return enclave;
    if (config.ESCROW_ENCLAVE_MODE !== 'software') throw new EscrowUnavailableError();
    enclave = new SoftwareEnclave({
        privateKeys: parseEscrowPrivateKeys(config.ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON ?? ''),
        activeKeyId: config.ESCROW_ENCLAVE_ACTIVE_KEY_ID ?? '',
    });
    return enclave;
};

/** Reset both singleton and environment snapshot after test environment changes. */
export const __setEscrowEnclaveForTests = (replacement: EscrowEnclave | undefined): void => {
    if (environment.NODE_ENV !== 'test') throw new EscrowUnavailableError();
    config = parseLcaApiEnvironment(process.env);
    enclave = replacement;
};
