import {
    EscrowBlobError,
    EscrowCodeError,
    EscrowPinMismatchError,
    EscrowPolicyError,
    EscrowUnavailableError,
} from './types';

/** Only allowlisted classifications reach logs; never serialize remote errors or payloads. */
export const logEscrowFailure = (error: unknown): void => {
    const reason =
        error instanceof EscrowCodeError
            ? {
                  codeMismatch: 'code_mismatch',
                  codeExpired: 'code_expired',
                  codeLocked: 'code_locked',
              }[error.reason]
            : error instanceof EscrowUnavailableError
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
    // One EMF event alongside the existing warning; no error text, request or identity fields.
    console.log(
        JSON.stringify({
            _aws: {
                Timestamp: Date.now(),
                CloudWatchMetrics: [
                    {
                        Namespace: 'LearnCard/Escrow',
                        Dimensions: [['Reason']],
                        Metrics: [{ Name: 'EnclaveFailure', Unit: 'Count' }],
                    },
                ],
            },
            Reason: reason,
            EnclaveFailure: 1,
        })
    );
};
