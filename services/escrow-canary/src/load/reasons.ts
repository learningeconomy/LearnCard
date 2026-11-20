import { EscrowRequestError } from '@learncard/sss-key-manager';
import { safeReason } from '../metrics';
import { ProvisionError } from '../provision/errors';
import { LoadError } from './errors';

/**
 * Maps any error to a fixed, non-sensitive label for the summary. Builds on the
 * canary's `safeReason`; adds HTTP status classes, timeouts, Firebase Admin
 * codes and SDK error class names, which capacity analysis needs. Never returns
 * error text, only labels defined here or allowlisted by `safeReason`.
 */
const SDK_ERRORS: Record<string, string> = {
    AtomicUpdateError: 'atomic_update',
    ShareWriteRejectedError: 'share_write_rejected',
    ShareVerificationError: 'share_verification',
    DuplicateShareCoordinateError: 'duplicate_share_coordinate',
    EscrowPinLockedError: 'pin_locked',
    EscrowPinUnavailableError: 'pin_unavailable',
    EscrowHoldRestartThrottledError: 'hold_restart_throttled',
    PinSignInStaleError: 'pin_sign_in_stale',
    EscrowEvidenceError: 'evidence',
    EscrowAuthorityTenantMismatchError: 'evidence',
    NitroAttestationError: 'attestation',
    AuthSessionError: 'auth_session',
};

const FIREBASE_ADMIN: Record<string, string> = {
    'auth/too-many-requests': 'firebase_rate_limit',
    'auth/quota-exceeded': 'firebase_quota',
    'auth/email-already-exists': 'firebase_email_exists',
    'auth/internal-error': 'firebase_internal',
    'auth/insufficient-permission': 'firebase_permission',
    'auth/project-not-found': 'firebase_project',
    'app/network-error': 'firebase_network',
    'app/network-timeout': 'firebase_network',
};

const LABEL = /^[a-z0-9_]{1,48}$/;

const httpClass = (status: number): string => {
    if (status === 429) return 'rate_limit';
    if (status === 409) return 'conflict';
    if (status >= 500) return 'http_5xx';
    return 'http_4xx';
};

export const loadReason = (error: unknown): string => {
    if (error instanceof LoadError) return LABEL.test(error.reason) ? error.reason : 'load';
    if (error instanceof ProvisionError) {
        const label = `${error.step}_${error.reason}`.toLowerCase();
        return LABEL.test(label) ? label : `${error.step}_failed`;
    }
    if (error instanceof EscrowRequestError) {
        if (error.reason) return error.reason === 'codeMismatch' ? 'code_mismatch' : 'code';
        return httpClass(error.status);
    }
    const allowlisted = safeReason(error);
    if (allowlisted !== 'unexpected') return allowlisted;
    if (!error || typeof error !== 'object') return 'unexpected';
    if ('code' in error && typeof error.code === 'string') {
        const firebase = FIREBASE_ADMIN[error.code];
        if (firebase) return firebase;
        if (error.code.startsWith('auth/') || error.code.startsWith('app/'))
            return 'firebase_admin';
    }
    const name = 'name' in error && typeof error.name === 'string' ? error.name : '';
    if (name === 'TimeoutError' || name === 'AbortError') return 'timeout';
    const constructorName = (error as object).constructor?.name ?? '';
    const sdk = SDK_ERRORS[name] ?? SDK_ERRORS[constructorName];
    if (sdk === 'atomic_update' && 'phase' in error && typeof error.phase === 'string') {
        // `phase` is a fixed SDK enum (split, verify, store_device, store_auth, verify_stored).
        const label = `atomic_update_${error.phase}`;
        return LABEL.test(label) ? label : sdk;
    }
    if (sdk) return sdk;
    const message = 'message' in error && typeof error.message === 'string' ? error.message : '';
    if (name === 'TypeError' && /fetch failed/i.test(message)) return 'transport';
    // Only a status number is derived from the text; the text itself is discarded.
    const status = /\b([45][0-9]{2})\b/.exec(message);
    if (status) return httpClass(Number(status[1]));
    if (/timed? ?out|timeout/i.test(message)) return 'timeout';
    return 'unexpected';
};
