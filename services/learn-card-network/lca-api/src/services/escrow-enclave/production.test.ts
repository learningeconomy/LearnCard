import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    __setEscrowEnclaveForTests,
    getEscrowEnclave,
    isEscrowEnabled,
    EscrowUnavailableError,
} from './index';

afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    __setEscrowEnclaveForTests(undefined);
});

describe('software enclave deploy-stage guard', () => {
    it.each(['production', 'prod', 'unknown'])(
        'fails closed for deploy stage %s despite test/offline flags',
        stage => {
            vi.stubEnv('ESCROW_ENCLAVE_MODE', 'software');
            vi.stubEnv(
                'ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON',
                JSON.stringify({ test: 'private-key' })
            );
            vi.stubEnv('ESCROW_ENCLAVE_ACTIVE_KEY_ID', 'test');
            vi.stubEnv('LAMBDA_STAGE', stage);
            vi.stubEnv('IS_OFFLINE', 'true');
            const log = vi.spyOn(console, 'error').mockImplementation(() => {});
            __setEscrowEnclaveForTests(undefined);
            expect(isEscrowEnabled()).toBe(false);
            expect(getEscrowEnclave).toThrow(EscrowUnavailableError);
            expect(log).toHaveBeenCalled();
        }
    );
});
