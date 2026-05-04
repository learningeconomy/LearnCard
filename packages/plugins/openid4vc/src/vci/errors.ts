/**
 * Stable, machine-readable error codes for the VCI (Verifiable Credential
 * Issuance) flow. UI can map `code` → friendly copy without string-matching
 * on the `message`.
 */
export type VciErrorCode =
    | 'metadata_fetch_failed'
    | 'metadata_invalid'
    | 'metadata_issuer_mismatch'
    | 'token_request_failed'
    | 'token_response_invalid'
    | 'proof_signing_failed'
    | 'credential_request_failed'
    | 'credential_response_invalid'
    | 'unsupported_grant'
    | 'unsupported_format'
    | 'tx_code_required'
    | 'nonce_required'
    | 'store_failed'
    | 'index_failed'
    | 'store_plane_missing'
    | 'index_plane_missing';

/**
 * Thrown by any VCI helper when a flow step fails. Carries the originating
 * HTTP status (when available) and the raw server body, so higher-level
 * code can surface it for logs without re-parsing.
 */
export class VciError extends Error {
    readonly code: VciErrorCode;
    readonly status?: number;
    readonly body?: unknown;

    constructor(
        code: VciErrorCode,
        message: string,
        opts: { status?: number; body?: unknown; cause?: unknown } = {}
    ) {
        super(message);
        this.name = 'VciError';
        this.code = code;
        this.status = opts.status;
        this.body = opts.body;

        // Preserve the original error for debugging without requiring the
        // ES2022 `Error(message, { cause })` overload.
        if (opts.cause !== undefined) {
            (this as { cause?: unknown }).cause = opts.cause;
        }
    }
}
