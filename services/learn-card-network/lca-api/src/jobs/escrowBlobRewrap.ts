import {
    claimEscrowEnrollmentLease,
    commitEscrowEnrollmentLease,
    findPendingEscrowHoldByAuthProvider,
    findUserKeyByAuthProvider,
    findUserKeysWithEscrowBlobKeyId,
    releaseEscrowEnrollmentLease,
    rewrapEscrowBlobByAuthProvider,
    ESCROW_ENROLLMENT_LEASE_TTL_MS,
    type EscrowEnrollmentLease,
} from '@models';
import {
    getEnclaveAttestationIdentity,
    getEscrowEnclave,
    isEscrowEnabled,
    isEscrowRemoteMode,
} from '../services/escrow-enclave';
import { randomBytes, randomUUID } from 'crypto';
import { EscrowUnavailableError } from '../services/escrow-enclave/types';
import type { AuthorityMutationResult } from '../services/escrow-enclave/authorityContract';
import {
    isDefiniteAuthorityRefusal,
    settleEscrowEnrollmentLease,
} from '../services/escrow-enclave/enrollmentLease';

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

    for (const candidate of candidates) {
        let userKey = candidate;
        let blob = userKey.escrowBlob;
        const authProvider = userKey.authProviders[0];
        // Already migrated (by this loop's own attestation refresh landing
        // mid-batch, or a concurrent run) since the candidate query ran.
        if (!blob || !authProvider || blob.enclaveKeyId === attestation.keyId) continue;
        try {
            if (await findPendingEscrowHoldByAuthProvider(authProvider)) {
                skippedPendingHold += 1;
                continue;
            }
            const enclave = getEscrowEnclave();
            if (isEscrowRemoteMode()) {
                // A PIN operation (or an earlier run) left a lease behind: settle it
                // against the authority first, then work from the converged copy.
                const stuck = userKey.escrowEnrollmentLease;
                if (stuck && stuck.expiresAt <= new Date()) {
                    await settleEscrowEnrollmentLease(authProvider, userKey.primaryDid, stuck, {
                        releaseIfUncommitted: true,
                    });
                    const settled = await findUserKeyByAuthProvider(
                        authProvider.type,
                        authProvider.id
                    );
                    if (
                        !settled?.escrowBlob ||
                        settled.escrowBlob.enclaveKeyId === attestation.keyId
                    )
                        continue;
                    userKey = settled;
                    blob = settled.escrowBlob;
                }
                // A live lease: its operation replaces this blob. Re-tried on a later run.
                if (userKey.escrowEnrollmentLease) continue;
                if (!enclave.getEnrollmentState || !blob.authorityGeneration)
                    throw new EscrowUnavailableError();
                const snapshot = await enclave.getEnrollmentState({
                    expectedDid: userKey.primaryDid,
                    nonce: randomBytes(32).toString('hex'),
                });
                const current = snapshot.state;
                if (
                    current.status !== 'active' ||
                    !current.envelope ||
                    current.authorityGeneration !== blob.authorityGeneration ||
                    current.did !== userKey.primaryDid ||
                    current.shareVersion !== blob.shareVersion ||
                    current.enrollmentEpoch !== blob.enrollmentEpoch
                )
                    throw new EscrowUnavailableError();
                if (current.envelope.keyId === attestation.keyId) {
                    const stored = await rewrapEscrowBlobByAuthProvider(
                        authProvider,
                        blob,
                        userKey.escrowPin,
                        current.envelope,
                        {
                            enclaveKeyId: attestation.keyId,
                            enclaveMode: attestation.mode,
                            measurements: attestation.measurements,
                        },
                        {
                            authorityGeneration: current.authorityGeneration,
                            enrollmentVersion: current.enrollmentVersion,
                            stateProof: snapshot.proof,
                        }
                    );
                    if (stored) rewrapped += 1;
                    continue;
                }
                // The authority call itself runs under the account's PIN-operation
                // lease, like an owner's intent: otherwise a lease claimed between this
                // commit and its Mongo write would leave the authority re-sealed and
                // Mongo on the old copy.
                const lease: EscrowEnrollmentLease = {
                    id: randomUUID(),
                    expiresAt: new Date(Date.now() + ESCROW_ENROLLMENT_LEASE_TTL_MS),
                    action: 'rewrap',
                    pinAction: 'keep',
                    pin: 'keep',
                    shareVersion: blob.shareVersion,
                    authorityGeneration: current.authorityGeneration,
                    expectedEnrollmentVersion: current.enrollmentVersion,
                    expectedPinGeneration: current.pinGeneration,
                    enrollmentEpoch: blob.enrollmentEpoch,
                    sourceBlobHash: blob.blobHash,
                    measurements: attestation.measurements,
                };
                const claimed = await claimEscrowEnrollmentLease(authProvider, {
                    lease,
                    expectedBlob: blob,
                    expectedPin: userKey.escrowPin,
                    requireOptedIn: true,
                });
                // Changed since read, a compare in flight, or another lease: next run.
                if (!claimed) continue;
                let authority: AuthorityMutationResult | undefined;
                try {
                    ({ authority } = await enclave.rewrapEscrowBlob({
                        envelope: blob.envelope,
                        expectedDid: userKey.primaryDid,
                        expectedShareVersion: blob.shareVersion,
                        sourceEnrollmentEpoch: blob.enrollmentEpoch,
                    }));
                    if (!authority?.envelope) throw new EscrowUnavailableError('invalid_response');
                } catch (error) {
                    if (isDefiniteAuthorityRefusal(error))
                        await releaseEscrowEnrollmentLease(authProvider, lease.id);
                    else
                        await settleEscrowEnrollmentLease(authProvider, userKey.primaryDid, lease, {
                            releaseIfUncommitted: false,
                        }).catch(() => undefined);
                    throw error;
                }
                const committed = await commitEscrowEnrollmentLease(authProvider, lease, {
                    envelope: authority.envelope,
                    authorityGeneration: authority.authorityGeneration,
                    enrollmentVersion: authority.enrollmentVersion,
                    enrollmentEpoch: authority.enrollmentEpoch,
                    receipt: authority.receipt,
                }).catch(() => null);
                const settled = committed
                    ? 'adopted'
                    : await settleEscrowEnrollmentLease(authProvider, userKey.primaryDid, lease, {
                          received: authority,
                          releaseIfUncommitted: false,
                      });
                if (settled === 'adopted') rewrapped += 1;
                continue;
            }
            const { envelope, authority } = await enclave.rewrapEscrowBlob({
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
                },
                authority
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
