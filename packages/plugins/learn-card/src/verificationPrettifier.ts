import { VerificationItem, VerificationStatusEnum } from '@learncard/types';

type Label = { check: string; message: string };

const SUCCESS_LABELS: Record<string, Label> = {
    parse: { check: 'Format', message: 'Valid' },
    disclosure_hash_integrity: { check: 'Selective Disclosure', message: 'Claims verified' },
    issuer_resolved: { check: 'Issuer', message: 'Identified' },
    issuer_signature: { check: 'Signature', message: 'Valid' },
    expiration: { check: 'Expiration', message: 'Does Not Expire' },
    vct: { check: 'Credential Type', message: 'Verified' },
    proof: { check: 'Proof', message: 'Valid' },
    credentialStatus: { check: 'Status', message: 'Active' },
    // The W3C verifier (learn-card/verify.ts) normalizes both `status` and
    // `credentialStatus` success rows to check: 'status' (lowercase), so the
    // bare `status` alias is required or those rows render unprettified.
    status: { check: 'Status', message: 'Active' },
    credentialSchema: { check: 'Schema', message: 'Valid' },
};

const ERROR_LABELS: Record<string, Label> = {
    invalid_compact_form: { check: 'Format', message: 'Invalid' },
    invalid_jwt: { check: 'Format', message: 'Invalid' },
    invalid_typ: { check: 'Format', message: 'Invalid type' },
    missing_iss: { check: 'Issuer', message: 'Missing' },
    missing_vct: { check: 'Credential Type', message: 'Missing' },
    missing_alg: { check: 'Signature', message: 'Algorithm missing' },
    unsupported_alg: { check: 'Signature', message: 'Unsupported algorithm' },
    unsupported_sd_alg: { check: 'Selective Disclosure', message: 'Unsupported algorithm' },
    invalid_disclosure: { check: 'Selective Disclosure', message: 'Invalid' },
    disclosure_hash_mismatch: { check: 'Selective Disclosure', message: 'Tampered' },
    issuer_resolution_failed: { check: 'Issuer', message: 'Could not be found' },
    verification_method_not_found: { check: 'Issuer', message: 'Key not found' },
    verification_method_not_authorized: { check: 'Issuer', message: 'Key not authorized' },
    signature_invalid: { check: 'Signature', message: 'Invalid' },
    expired: { check: 'Expiration', message: 'Expired' },
    not_yet_valid: { check: 'Expiration', message: 'Not yet valid' },
    vct_mismatch: { check: 'Credential Type', message: 'Mismatch' },
    status_check_failed: { check: 'Status', message: 'Revoked or suspended' },
    kb_jwt_invalid: { check: 'Key Binding', message: 'Invalid' },
    presentation_verification_failed: { check: 'Presentation', message: 'Invalid' },
    key_binding_mismatch: { check: 'Holder Key', message: 'Mismatch' },
    unsupported_cnf_confirmation_type: { check: 'Holder Key', message: 'Unsupported type' },
    internal_error: { check: 'Verification', message: 'Something went wrong' },
};

// Raw resolver / engine diagnostics that must never reach the UI. did:web verification
// resolves the issuer's DID document via an in-browser fetch, which fails (CORS / offline)
// with messages like "Unable to resolve: Error sending HTTP request (.../.well-known/did.json)
// ... Failed to fetch ... wasm-function[...]". Map these to friendly copy instead.
const RESOLUTION_FAILURE_RE =
    /unable to resolve|error sending (?:an? )?(?:http )?request|failed to fetch|well-known\/did\.json|dereferenc|could not (?:retrieve|dereference|resolve)|network ?error/i;

// Obvious raw stack / engine internals: WASM frames, JS source locations, JS error types.
const RAW_DIAGNOSTIC_RE = /wasm-function|\bat https?:\/\/|\.js:\d+|\bJsValue\(|\bTypeError\b/i;

const isAlreadyPrettified = (check: string | undefined): boolean => {
    if (!check) return true;
    return /^[A-Z]/.test(check) || /\s/.test(check);
};

const extractErrorCode = (message: string | undefined): string | undefined => {
    if (!message) return undefined;
    const match = message.match(/^([a-z][a-z0-9_]*):/);
    return match?.[1];
};

/**
 * Derive a snake_case error code from a `check` that may already be a raw
 * diagnostic phrase. The W3C verifier's `transformErrorCheck` returns
 * `error.split(' error')[0]`, which can be e.g. `"signature_invalid: bad
 * signature"` — the leading token before `:`/whitespace is the real code.
 */
const codeFromCheck = (check: string | undefined): string | undefined => {
    if (!check) return undefined;
    const token = check.split(/[:\s]/)[0];
    return /^[a-z][a-z0-9_]*$/.test(token) ? token : undefined;
};

/**
 * Resolve a known ERROR_LABELS code from a failed item. Layer 1
 * (verify.ts) puts the code in `check` (possibly containing spaces) and
 * the human diagnostic in `details`, NOT `message` — so scan all three
 * and only accept a candidate that maps to a known label.
 */
const resolveErrorCode = (item: VerificationItem): string | undefined => {
    const candidates = [
        extractErrorCode(item.message),
        extractErrorCode(item.details),
        codeFromCheck(item.check),
    ];
    return candidates.find((code): code is string => code !== undefined && code in ERROR_LABELS);
};

/**
 * A `message` is "raw" when it carries no human-meaningful detail
 * beyond the check code itself. Upstream verifiers vary:
 *
 * - SD-JWT-VC plugin emits `{ check: 'expiration', message: 'expiration' }`
 *   (or message === undefined) — the message is a placeholder and we
 *   should replace it with the prettified label.
 * - The W3C VC verifier (`packages/plugins/learn-card/src/verify.ts`)
 *   emits `{ check: 'expiration', message: 'Expires 28 FEB 2023' }` —
 *   the message is already humanized with credential-specific detail
 *   (the actual expiration date), and we MUST preserve it.
 * - SD-JWT-VC failures arrive as `{ check: 'signature_invalid',
 *   message: 'signature_invalid: details' }` — the message is raw
 *   diagnostic prefixed with the code; replace with the label.
 *
 * Treating "message looks raw" as the trigger keeps the prettifier
 * idempotent and non-destructive for any verifier that has already
 * done its own humanization.
 */
const isMessageRaw = (message: string | undefined, check: string): boolean => {
    if (!message) return true;
    if (message === check) return true;
    if (/^[a-z][a-z0-9_]*$/.test(message)) return true;
    if (message.startsWith(`${check}:`)) return true;
    return false;
};

export const prettifyVerificationItem = (item: VerificationItem): VerificationItem => {
    const isFailed = item.status === VerificationStatusEnum.Failed;

    if (isFailed) {
        // Failures are resolved before the `isAlreadyPrettified` guard
        // because Layer 1 emits a `check` that often contains whitespace
        // (e.g. "signature_invalid: bad signature"), which the guard would
        // otherwise treat as already-prettified and skip.
        const code = resolveErrorCode(item);
        if (!code) {
            // No known error code. Never surface raw resolver / WASM diagnostics to the user;
            // map them to stable friendly copy. Anything else (e.g. a humanized "Status:
            // Revoked" detail) passes through untouched.
            const raw = [item.message, item.details, item.check].filter(Boolean).join(' ');
            if (RESOLUTION_FAILURE_RE.test(raw)) {
                return {
                    ...item,
                    check: 'Issuer',
                    message: 'Could not be reached',
                    details: undefined,
                };
            }
            if (RAW_DIAGNOSTIC_RE.test(raw)) {
                return {
                    ...item,
                    check: 'Verification',
                    message: 'Could not be verified',
                    details: undefined,
                };
            }
            return item;
        }
        const label = ERROR_LABELS[code];

        // The UI renders failed rows as `message ?? details`. If Layer 1
        // humanized the diagnostic into `details` (e.g. "Expired 28 FEB
        // 2023", "Status: Revoked"), preserve it: keep `message` empty so
        // the UI falls through to `details`. If `message` itself is already
        // humanized, keep it. Only when neither carries human detail do we
        // synthesize the generic label, so a real diagnostic is never shadowed.
        const detailsHumanized = Boolean(item.details) && !isMessageRaw(item.details, item.check);
        const messageHumanized = Boolean(item.message) && !isMessageRaw(item.message, item.check);

        let message: string | undefined;
        if (messageHumanized) message = item.message;
        else if (detailsHumanized) message = undefined;
        else message = label.message;

        return {
            ...item,
            check: label.check,
            message,
        };
    }

    if (isAlreadyPrettified(item.check)) return item;

    const label = SUCCESS_LABELS[item.check];
    if (label) {
        return {
            ...item,
            check: label.check,
            message: isMessageRaw(item.message, item.check) ? label.message : item.message,
        };
    }

    return item;
};

export const prettifyVerificationItems = (items: VerificationItem[]): VerificationItem[] =>
    items.map(prettifyVerificationItem);
