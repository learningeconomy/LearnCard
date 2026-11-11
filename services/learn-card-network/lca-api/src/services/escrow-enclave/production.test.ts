import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    __setEscrowEnclaveForTests,
    checkEscrowRemoteConfig,
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

describe('remote enclave config guard', () => {
    const metricEvents = (log: { mock: { calls: unknown[][] } }): Record<string, unknown>[] =>
        log.mock.calls
            .map(([line]) =>
                typeof line === 'string' && line.startsWith('{')
                    ? (JSON.parse(line) as Record<string, unknown>)
                    : null
            )
            .filter((event): event is Record<string, unknown> => event?.EnclaveFailure === 1);

    it.each([
        ['URL', { ESCROW_ENCLAVE_REMOTE_TOKEN: 'secret-token-value-0123456789abcdef' }],
        ['token', { ESCROW_ENCLAVE_REMOTE_URL: 'https://escrow.internal:8443' }],
        ['both', {}],
    ])('reports a missing %s once per container, without values', (_name, present) => {
        vi.stubEnv('ESCROW_ENCLAVE_MODE', 'remote');
        vi.stubEnv('ESCROW_ENCLAVE_REMOTE_URL', '');
        vi.stubEnv('ESCROW_ENCLAVE_REMOTE_TOKEN', '');
        for (const [key, value] of Object.entries(present)) vi.stubEnv(key, value);
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});
        __setEscrowEnclaveForTests(undefined);

        checkEscrowRemoteConfig();
        expect(isEscrowEnabled()).toBe(false);
        expect(getEscrowEnclave).toThrow(EscrowUnavailableError);

        expect(error).toHaveBeenCalledTimes(1);
        expect(String(error.mock.calls[0]?.[0])).toContain('ESCROW_ENCLAVE_MODE=remote');
        expect(JSON.stringify(error.mock.calls)).not.toContain(
            'secret-token-value-0123456789abcdef'
        );
        expect(JSON.stringify(error.mock.calls)).not.toContain('escrow.internal');
        expect(metricEvents(log)).toEqual([
            expect.objectContaining({ Reason: 'remote_config_missing', EnclaveFailure: 1 }),
        ]);
    });

    it('stays quiet when the remote config is complete', () => {
        vi.stubEnv('ESCROW_ENCLAVE_MODE', 'remote');
        vi.stubEnv('ESCROW_ENCLAVE_REMOTE_URL', 'https://escrow.internal:8443');
        vi.stubEnv('ESCROW_ENCLAVE_REMOTE_TOKEN', 'secret-token-value-0123456789abcdef');
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});
        __setEscrowEnclaveForTests(undefined);

        checkEscrowRemoteConfig();
        expect(isEscrowEnabled()).toBe(true);
        expect(error).not.toHaveBeenCalled();
        expect(metricEvents(log)).toEqual([]);
    });

    it('does not report when escrow is simply off', () => {
        vi.stubEnv('ESCROW_ENCLAVE_MODE', '');
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        __setEscrowEnclaveForTests(undefined);

        checkEscrowRemoteConfig();
        expect(isEscrowEnabled()).toBe(false);
        expect(error).not.toHaveBeenCalled();
    });
});
