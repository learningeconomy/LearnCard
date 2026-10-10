import * as Sentry from '@sentry/serverless';
import {
    confirmEscrowEnclaveCancellation,
    recordEscrowEnclaveCancelAttempt,
    ESCROW_HOLD_REMINDER_WINDOW_MS,
    type EscrowHold,
    type MongoUserKeyType,
} from '@models';
import { getEscrowEnclave } from './index';
import { escrowBlobIdentity } from './blobIdentity';

/** No provider identities, ciphertexts, tokens or transport error details in logs. */
export const logEscrowCancellationPending = (urgent: boolean): void => {
    const message = urgent
        ? 'Escrow enclave cancellation unconfirmed within 24h of release or overdue'
        : 'Escrow enclave cancellation pending retry';
    if (urgent) console.error('[escrow-cancellation]', message);
    else console.warn('[escrow-cancellation]', message);
    try {
        Sentry.captureMessage(message, urgent ? 'error' : 'warning');
    } catch {
        console.error('[escrow-cancellation] cancellation alert delivery failed');
    }
};

/** Mongo cancellation is authoritative for the API; only a positive enclave reply confirms revocation. */
export const cancelHoldInEnclave = async (
    hold: EscrowHold,
    userKey?: MongoUserKeyType | null,
    now = new Date()
): Promise<boolean> => {
    try {
        if (!(await recordEscrowEnclaveCancelAttempt(hold._id))) return true;
        const envelope = hold.enclaveEnvelope ?? userKey?.escrowBlob?.envelope;
        // Never cancel using a replacement enrollment or fabricate a legacy signed record.
        if (
            !hold.holdRecord ||
            !envelope ||
            escrowBlobIdentity(envelope) !== hold.holdRecord.hold.blobHash
        ) {
            throw new Error('Cancellation material unavailable');
        }
        await getEscrowEnclave().cancelHold({
            envelope,
            hold: hold.holdRecord,
            clientEphemeralPublicKey: hold.clientEphemeralPublicKey,
            expectedDid: hold.primaryDid,
        });
        await confirmEscrowEnclaveCancellation(hold._id);
        return true;
    } catch {
        // Policy/unknown/terminal errors are ambiguous, not proof of cancellation.
        // Includes lost success replies and BLOCKER-ENROLLMENT's Unavailable.
        logEscrowCancellationPending(
            hold.releaseAfter.getTime() <= now.getTime() + ESCROW_HOLD_REMINDER_WINDOW_MS
        );
        return false;
    }
};
