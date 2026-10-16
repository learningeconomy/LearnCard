import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRemoteEnclave } from './remoteEnclave';
import { logEscrowFailure } from './logFailure';

afterEach(() => vi.restoreAllMocks());

describe('escrow failure reasons', () => {
    it.each([
        [403, 'policy', 'policy'],
        [403, 'pinMismatch', 'pin_mismatch'],
        [403, 'blob', 'blob'],
        [503, 'ledger', 'ledger'],
        [503, 'time', 'time'],
        [412, 'unavailable', 'unavailable'],
        [403, 'secret-unknown-code', 'http_refusal'],
        [429, 'unknown', 'rate_limit'],
        [200, 'unknown', 'invalid_response'],
    ])('classifies HTTP %s / %s without logging payloads', async (status, code, reason) => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const enclave = createRemoteEnclave({
            baseUrl: 'https://example.invalid',
            token: 'secret-token',
            timeoutMs: 100,
            transport: {
                post: async () => ({ status, data: { code, message: 'secret@example.com' } }),
            },
        });
        await enclave.getAttestation().catch(logEscrowFailure);
        expect(warn).toHaveBeenCalledExactlyOnceWith('[LCA escrow] enclave operation failed', {
            reason,
        });
    });

    it('drops transport error details', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const enclave = createRemoteEnclave({
            baseUrl: 'https://example.invalid',
            token: 'secret-token',
            timeoutMs: 100,
            transport: {
                post: async () => {
                    throw new Error('secret-token');
                },
            },
        });
        await enclave.getAttestation().catch(logEscrowFailure);
        expect(warn).toHaveBeenCalledExactlyOnceWith('[LCA escrow] enclave operation failed', {
            reason: 'transport',
        });
    });
});
