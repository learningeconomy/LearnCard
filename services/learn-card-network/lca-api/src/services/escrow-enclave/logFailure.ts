import {
    EscrowBlobError,
    EscrowPinMismatchError,
    EscrowPolicyError,
    EscrowUnavailableError,
} from './types';

/** Only allowlisted classifications reach logs; never serialize remote errors or payloads. */
export const logEscrowFailure = (error: unknown): void => {
    const reason =
        error instanceof EscrowUnavailableError
            ? error.reason
            : error instanceof EscrowPolicyError
              ? 'policy'
              : error instanceof EscrowPinMismatchError
                ? 'pin_mismatch'
                : error instanceof EscrowBlobError
                  ? 'blob'
                  : 'unexpected';
    // lca-api uses structured console warnings rather than the browser logger.
    console.warn('[LCA escrow] enclave operation failed', { reason });
};
