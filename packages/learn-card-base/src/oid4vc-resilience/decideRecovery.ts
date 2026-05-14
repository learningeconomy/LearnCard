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

const extractErrorMessage = (raw: unknown): string => {
    if (raw instanceof Error) return raw.message;
    if (typeof raw === 'string') return raw;
    if (raw && typeof raw === 'object') {
        const message = (raw as { message?: unknown }).message;
        if (typeof message === 'string') return message;
    }
    return '';
};

/**
 * A wallet-classified error is treated as a signer-resolution
 * failure (i.e. the issuer/verifier could not resolve the holder's
 * DID and rejected our proof) when its message matches any of the
 * known patterns. The patterns are deliberately broad — different
 * vendors emit different error strings for the same root cause
 * (walt.id: "No valid public key JWKs", Sphereon: "could not resolve
 * DID", EUDI: "invalid_proof"). Adding new patterns is a safe
 * widening: the worst that happens is an extra silent retry.
 */
const isSignerResolutionFailure = (friendly: FriendlyErrorInfo, raw: unknown): boolean => {
    if (friendly.kind !== 'wallet' && friendly.kind !== 'request_invalid') return false;
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
