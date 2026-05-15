import type { FriendlyErrorInfo } from '../helpers/openid4vcErrors';
import type { AttemptLog, RecoveryDecision } from './types';

const MAX_TRANSPORT_RETRIES = 2;
const TRANSPORT_BACKOFF_BASE_MS = 1000;
const TRANSPORT_BACKOFF_CAP_MS = 5000;

const SIGNER_FAILURE_PATTERNS = [
    /no valid public key/i,
    /did resolution/i,
    /could not resolve did/i,
    /cannot resolve/i,
    /unknown verification method/i,
    /invalid_proof/i,
    /proof.*invalid/i,
    /verification method.*not found/i,
    /unable to dereference/i,
] as const;

/**
 * Structured dispatch table for signer-resolution failures. Checked
 * BEFORE the regex pattern fallback because it's faster, more
 * deterministic, and locale-independent.
 *
 * Each entry is a conjunction: ALL specified fields must match.
 * Unspecified fields are wildcards. The error must satisfy at least
 * ONE entry to be classified structurally.
 *
 * Maintenance: when production telemetry (`OPENID_RESILIENCE_
 * UNRECOGNIZED_FAILURE`) surfaces a recurring shape, add it here as
 * a structured pattern. Patterns added here should be tight enough
 * to not cause false-positive retries on truly unrecoverable errors.
 */
interface StructuredSignerFailurePattern {
    errorName?: string;
    code?: string;
    statusRange?: [number, number];
    bodyError?: string;
}

const STRUCTURED_SIGNER_FAILURES: readonly StructuredSignerFailurePattern[] = [
    { errorName: 'VciError', code: 'credential_request_failed', statusRange: [500, 599] },
    { errorName: 'VciError', code: 'proof_signing_failed' },
    { errorName: 'VpSubmitError', statusRange: [500, 599] },
    { bodyError: 'invalid_proof' },
];

const matchesStructuredSignerFailure = (raw: unknown): boolean => {
    if (!raw || typeof raw !== 'object') return false;
    const err = raw as {
        name?: unknown;
        code?: unknown;
        status?: unknown;
        body?: unknown;
    };

    const name = typeof err.name === 'string' ? err.name : undefined;
    const code = typeof err.code === 'string' ? err.code : undefined;
    const status = typeof err.status === 'number' ? err.status : undefined;
    const bodyError =
        err.body && typeof err.body === 'object'
            ? (err.body as Record<string, unknown>).error
            : undefined;
    const bodyErrorStr = typeof bodyError === 'string' ? bodyError : undefined;

    return STRUCTURED_SIGNER_FAILURES.some(pattern => {
        if (pattern.errorName && name !== pattern.errorName) return false;
        if (pattern.code && code !== pattern.code) return false;
        if (pattern.statusRange) {
            const [lo, hi] = pattern.statusRange;
            if (status === undefined || status < lo || status > hi) return false;
        }
        if (pattern.bodyError && bodyErrorStr !== pattern.bodyError) return false;
        return true;
    });
};

/**
 * Concatenate every text-y field on a thrown error into a single
 * search corpus for the signer-failure pattern check. The plugin's
 * `VciError` / `VpError` wrap the issuer's HTTP failure with a
 * generic message like `"Credential endpoint returned 500 (unknown)"`
 * and stash the actual issuer error string on `err.body.message`
 * (walt.id) / `err.body.error_description` (OAuth2-style) / `err.body`
 * (raw string). Fetch failures put the root cause on `err.cause`.
 *
 * Concatenating every source means a single regex pass covers all
 * the places vendors hide the real error string without needing
 * vendor-specific extractors.
 */
export const extractErrorMessage = (raw: unknown): string => {
    const parts: string[] = [];

    const push = (value: unknown): void => {
        if (typeof value === 'string' && value.length > 0) parts.push(value);
    };

    if (typeof raw === 'string') {
        push(raw);
        return parts.join(' | ');
    }

    if (!raw || typeof raw !== 'object') return '';

    const err = raw as {
        message?: unknown;
        body?: unknown;
        cause?: unknown;
    };

    push(err.message);

    if (err.body) {
        if (typeof err.body === 'string') {
            push(err.body);
        } else if (typeof err.body === 'object') {
            const body = err.body as Record<string, unknown>;
            push(body.message);
            push(body.error_description);
            push(body.error);
            push(body.detail);
        }
    }

    if (err.cause instanceof Error) {
        push(err.cause.message);
    } else if (err.cause && typeof err.cause === 'object') {
        push((err.cause as { message?: unknown }).message);
    }

    return parts.join(' | ');
};

/**
 * A wallet-classified error is treated as a signer-resolution
 * failure (i.e. the issuer/verifier could not resolve the holder's
 * DID and rejected our proof) when EITHER:
 *  - The structured dispatch matches the raw error's typed fields
 *    (`name` / `code` / `status` / `body.error`), OR
 *  - The extracted message corpus matches one of the regex patterns.
 *
 * Structured runs first because it's faster, more deterministic, and
 * locale-independent. Pattern fallback is wide on purpose so vendor
 * dialect differences (walt.id "No valid public key JWKs", Sphereon
 * "could not resolve DID", EUDI "invalid_proof") all reach the same
 * recovery branch. Adding patterns is a safe widening: the worst
 * outcome is an extra silent retry.
 *
 * Exported so the orchestrator can record `patternMatched` on the
 * `unrecognized_recoverable_failure` telemetry event — letting
 * production dashboards distinguish "we should have retried but
 * didn't recognize the shape" from "we tried and exhausted the
 * fallback chain."
 */
export const isSignerResolutionFailure = (
    friendly: FriendlyErrorInfo,
    raw: unknown
): boolean => {
    if (friendly.kind !== 'wallet' && friendly.kind !== 'request_invalid') return false;
    if (matchesStructuredSignerFailure(raw)) return true;
    const message = extractErrorMessage(raw);
    return SIGNER_FAILURE_PATTERNS.some(p => p.test(message));
};

export interface DecideRecoveryArgs {
    friendly: FriendlyErrorInfo;
    raw: unknown;
    attempted: AttemptLog;
    /**
     * All signer strategy ids that are applicable in this exchange
     * context, in preferred order. The decision function picks the
     * first id NOT in `attempted.signersTried`.
     */
    availableSigners: string[];
}

/**
 * Pure function mapping a classified error + accumulated attempt log
 * → the next action. The orchestrator drives the loop; this function
 * encodes the policy. All branches are exhaustively unit-tested in
 * `decideRecovery.test.ts` so changes to fallback semantics are
 * visible in diffs.
 */
export const decideRecovery = ({
    friendly,
    raw,
    attempted,
    availableSigners,
}: DecideRecoveryArgs): RecoveryDecision => {
    if (friendly.kind === 'transport') {
        if (attempted.transportRetries < MAX_TRANSPORT_RETRIES) {
            const backoffMs = Math.min(
                TRANSPORT_BACKOFF_BASE_MS * Math.pow(2, attempted.transportRetries),
                TRANSPORT_BACKOFF_CAP_MS
            );
            return {
                kind: 'retry_silent',
                nextStrategy: {
                    axis: 'transport',
                    id: `transport-retry-${attempted.transportRetries + 1}`,
                },
                backoffMs,
            };
        }
        return { kind: 'surface_error', friendly };
    }

    if (isSignerResolutionFailure(friendly, raw)) {
        const untried = availableSigners.filter(s => !attempted.signersTried.includes(s));
        if (untried.length === 0) return { kind: 'surface_error', friendly };

        const next = untried[0];
        if (next === 'did:key') {
            return { kind: 'retry_silent', nextStrategy: { axis: 'signer', id: next } };
        }
        return {
            kind: 'retry_with_prompt',
            nextStrategy: { axis: 'signer', id: next },
            prompt: {
                title: "Let's try a different way",
                body: "This issuer needs a different identity format. We can try again with one that's more compatible.",
                cta: 'Try again',
                cancelCta: 'Cancel',
                severity: 'info',
            },
        };
    }

    if (friendly.kind === 'trust_gap' && attempted.trustGapsAccepted === 0) {
        return {
            kind: 'retry_with_prompt',
            nextStrategy: { axis: 'trust', id: 'accept-untrusted' },
            prompt: {
                title: "Issuer hasn't been verified",
                body: "We don't recognize this issuer. Continue anyway?",
                cta: 'Continue',
                cancelCta: 'Cancel',
                severity: 'warning',
            },
        };
    }

    return { kind: 'surface_error', friendly };
};
