/**
 * Error type shared by the pure LC-2187 share-link helpers.
 *
 * Every failure is fail-closed and carries a stable machine-readable code so
 * callers can render a friendly message without inspecting error text, and so
 * tests can assert the exact rejection reason.
 */
export type ShareLinkErrorCode =
    | 'INVALID_SHARE_ID'
    | 'INVALID_CONTENT_KEY'
    | 'INVALID_CONTENT_VERSION'
    | 'INVALID_ENVELOPE'
    | 'UNSUPPORTED_VERSION'
    | 'UNSUPPORTED_ALGORITHM'
    | 'INVALID_IV'
    | 'CIPHERTEXT_TOO_SHORT'
    | 'CIPHERTEXT_TOO_LARGE'
    | 'DECRYPT_FAILED'
    | 'INVALID_PLAINTEXT'
    | 'INVALID_LINK'
    | 'INVALID_MANIFEST'
    | 'INVALID_RECOVERY'
    | 'RECOVERY_TOO_LARGE'
    | 'RECOVERY_ADAPTER_UNAVAILABLE';

/** Stable-code error for protocol validation and cryptographic failures. */
export class ShareLinkError extends Error {
    readonly code: ShareLinkErrorCode;

    constructor(code: ShareLinkErrorCode, message: string) {
        super(message);
        this.name = 'ShareLinkError';
        this.code = code;
    }
}

/** Narrow `unknown` to {@link ShareLinkError}. */
export const isShareLinkError = (error: unknown): error is ShareLinkError =>
    error instanceof ShareLinkError;
