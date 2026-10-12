import {
    findPendingEscrowHoldByAuthProvider,
    findUserKeysWithEscrowBlobKeyId,
    rewrapEscrowBlobByAuthProvider,
} from '@models';
import {
    getEnclaveAttestationIdentity,
    getEscrowEnclave,
    isEscrowEnabled,
} from '../services/escrow-enclave';

const DEFAULT_REWRAP_BATCH_LIMIT = 200;

export interface EscrowBlobRewrapResult {
    rewrapped: number;
    skippedPendingHold: number;
    failed: number;
}

export interface RunEscrowBlobRewrapOptions {
    limit?: number;
}

/**
 * Deliberately drops the caught error's message, not just its stack: a real
 * enclave/decrypt failure could embed plaintext or a proof in its own
 * message text, so forwarding it here would leak secrets through the one
 * logging path meant to report the failure. Mirrors
 * `escrowHoldReminders.ts`'s `logJobError`, which makes the same trade-off
 * for the same reason. `userKeyId` (a Mongo id, not a DID/email) is safe to
 * log for triage.
 */
const logJobError = (userKeyId: string | undefined, error: unknown): void => {
    console.error('[escrow-blob-rewrap] failed to process user key', {
        userKeyId,
        errorType: error instanceof Error ? error.name : typeof error,
    });
};

/**
 * Scheduled maintenance job (P9.3): migrates escrow blobs still sealed
 * under a previous enclave key onto the current key, so that key can
 * eventually be retired. Covers accounts that never sign in again after a
 * key rotation — those already migrate client-side on next login via P9.2's
 * carry-on-enroll path.
 *
 * No-ops when escrow is disabled for this stage/tenant, or when the
 * enclave's current (cached) identity reports no previous keys at all —
 * the common case once every previous key has been fully retired. Skips
 * (does not touch) any account with a pending recovery hold: the signed
 * hold record binds the OLD blob's hash/epoch, so re-sealing mid-hold would
 * break an in-progress recovery; those accounts are simply re-tried on a
 * later run once their hold resolves. Every write is an atomic
 * compare-and-swap (`rewrapEscrowBlobByAuthProvider`); losing that race to a
 * concurrent re-enroll/carry/opt-out is a silent no-op, not a failure.
 */
export const runEscrowBlobRewrap = async (
    options: RunEscrowBlobRewrapOptions = {}
): Promise<EscrowBlobRewrapResult> => {
    const empty: EscrowBlobRewrapResult = { rewrapped: 0, skippedPendingHold: 0, failed: 0 };
    if (!isEscrowEnabled()) return empty;

    // Cheap, cache-aware gate: avoids a real enclave round trip on every
    // run once there is nothing left to migrate (see services/escrow-enclave/
    // index.ts's `getEnclaveAttestationIdentity`).
    const identity = await getEnclaveAttestationIdentity().catch(() => undefined);
    if (!identity || identity.previousKeyIds.length === 0) return empty;

    const limit = options.limit ?? DEFAULT_REWRAP_BATCH_LIMIT;
    const candidates = await findUserKeysWithEscrowBlobKeyId(identity.previousKeyIds, limit);
    if (candidates.length === 0) return empty;

    // A fresh, full attestation call (not just the cached identity) for the
    // measurements the migrated blob must carry; only fetched once there is
    // actually something to migrate this run.
    const attestation = await getEscrowEnclave().getAttestation();

    let rewrapped = 0;
    let skippedPendingHold = 0;
    let failed = 0;

    for (const userKey of candidates) {
        const blob = userKey.escrowBlob;
        const authProvider = userKey.authProviders[0];
        // Already migrated (by this loop's own attestation refresh landing
        // mid-batch, or a concurrent run) since the candidate query ran.
        if (!blob || !authProvider || blob.enclaveKeyId === attestation.keyId) continue;
        try {
            if (await findPendingEscrowHoldByAuthProvider(authProvider)) {
                skippedPendingHold += 1;
                continue;
            }
            const { envelope } = await getEscrowEnclave().rewrapEscrowBlob({
                envelope: blob.envelope,
                expectedDid: userKey.primaryDid,
                expectedShareVersion: blob.shareVersion,
                sourceEnrollmentEpoch: blob.enrollmentEpoch,
            });
            const stored = await rewrapEscrowBlobByAuthProvider(
                authProvider,
                blob,
                userKey.escrowPin,
                envelope,
                {
                    enclaveKeyId: attestation.keyId,
                    enclaveMode: attestation.mode,
                    measurements: attestation.measurements,
                }
            );
            if (stored) rewrapped += 1;
            // else: lost the compare-and-swap race (a concurrent re-enroll,
            // PIN change or opt-out since this candidate was read) — not a
            // failure, just re-tried on a later run if still applicable.
        } catch (error) {
            failed += 1;
            logJobError(userKey._id, error);
        }
    }

    return { rewrapped, skippedPendingHold, failed };
};
