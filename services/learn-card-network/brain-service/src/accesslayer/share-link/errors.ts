/**
 * Typed failures raised by the share-link lifecycle repository.
 *
 * Expected races are surfaced as codes rather than free-form strings so routes and
 * the reconciliation worker can map them to tRPC/HTTP responses without parsing
 * messages, and so tests can assert the exact failure class.
 */
export type ShareLinkRepositoryErrorCode =
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'OPERATION_IN_FLIGHT'
    | 'LEASE_EXPIRED'
    | 'STALE_GENERATION'
    | 'PRECONDITION_FAILED'
    | 'INVALID_INPUT';

export class ShareLinkRepositoryError extends Error {
    readonly code: ShareLinkRepositoryErrorCode;

    constructor(code: ShareLinkRepositoryErrorCode, message: string) {
        super(message);
        this.name = 'ShareLinkRepositoryError';
        this.code = code;
    }
}

export const isShareLinkRepositoryError = (error: unknown): error is ShareLinkRepositoryError =>
    error instanceof ShareLinkRepositoryError;

export function failShareLink(code: ShareLinkRepositoryErrorCode, message: string): never {
    throw new ShareLinkRepositoryError(code, message);
}
