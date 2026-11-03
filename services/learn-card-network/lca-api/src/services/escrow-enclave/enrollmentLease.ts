import { randomBytes } from 'crypto';
import {
    commitEscrowEnrollmentLease,
    findUserKeyByAuthProvider,
    releaseEscrowEnrollmentLease,
    type AuthProviderMapping,
    type EscrowEnrollmentLease,
} from '@models';
import { getEscrowEnclave, isEscrowRemoteMode } from './index';
import {
    EscrowBlobError,
    EscrowCodeError,
    EscrowPolicyError,
    EscrowUnavailableError,
} from './types';
import { escrowBlobIdentity } from './blobIdentity';
import type { AuthorityMutationResult, AuthorityStateResponse } from './authorityContract';

/**
 * A definite authority refusal: the operation never committed, so its lease can be
 * released at once. Anything else (timeout, lost or malformed response) may have.
 */
export const isDefiniteAuthorityRefusal = (error: unknown): boolean =>
    error instanceof EscrowPolicyError ||
    error instanceof EscrowBlobError ||
    error instanceof EscrowCodeError;

/**
 * True when the authority's current state is exactly the commit `lease` was claimed
 * for: one enrollment version past the read, the signed epoch and share version, the
 * PIN generation the intent's action implies and, when the caller holds the returned
 * mutation, the same envelope identity.
 */
export const isLeaseCommitted = (
    lease: EscrowEnrollmentLease,
    { state }: AuthorityStateResponse,
    received?: AuthorityMutationResult
): boolean => {
    const pinChanged = lease.pinAction !== 'keep';
    if (
        state.authorityGeneration !== lease.authorityGeneration ||
        state.enrollmentVersion !== lease.expectedEnrollmentVersion + 1 ||
        state.enrollmentEpoch !== lease.enrollmentEpoch ||
        (lease.expectedPinGeneration !== undefined &&
            state.pinGeneration !== lease.expectedPinGeneration + (pinChanged ? 1 : 0)) ||
        (pinChanged && state.hasPin !== (lease.pinAction !== 'clear'))
    )
        return false;
    if (received && received.enrollmentVersion !== state.enrollmentVersion) return false;
    if (lease.action === 'disable') return state.status === 'disabled' && !state.envelope;
    return (
        state.status === 'active' &&
        !!state.envelope &&
        state.shareVersion === lease.shareVersion &&
        (!received?.envelope ||
            escrowBlobIdentity(received.envelope) === escrowBlobIdentity(state.envelope))
    );
};

/**
 * Converge Mongo to the authority after a PIN-operation lease did not complete
 * normally (lost response, crash, or the lease's own write missed). Reads the
 * authority's state: if it is the lease's commit, persists the authority's envelope,
 * epoch and version with the PIN record the lease recorded (`adopted`, also when
 * another request already persisted that same commit); otherwise drops the lease
 * when `releaseIfUncommitted` (only safe once no call under it can still land: an
 * expired lease, or a definite refusal), else leaves it to expire (`kept`).
 * Idempotent: the adopt write is conditioned on the lease id (or, with the returned
 * mutation in hand, on the lease being gone) and on the blob it replaced.
 */
export const settleEscrowEnrollmentLease = async (
    authProvider: AuthProviderMapping,
    primaryDid: string,
    lease: EscrowEnrollmentLease,
    {
        received,
        releaseIfUncommitted,
    }: { received?: AuthorityMutationResult; releaseIfUncommitted: boolean }
): Promise<'adopted' | 'released' | 'kept'> => {
    const enclave = getEscrowEnclave();
    if (!isEscrowRemoteMode() || !enclave.getEnrollmentState) {
        await releaseEscrowEnrollmentLease(authProvider, lease.id);
        return 'released';
    }
    const current = await enclave.getEnrollmentState({
        expectedDid: primaryDid,
        nonce: randomBytes(32).toString('hex'),
    });
    if (current.state.did !== primaryDid) throw new EscrowUnavailableError('invalid_response');
    if (isLeaseCommitted(lease, current, received)) {
        const adopted = await commitEscrowEnrollmentLease(
            authProvider,
            lease,
            {
                envelope: current.state.envelope,
                authorityGeneration: current.state.authorityGeneration,
                enrollmentVersion: current.state.enrollmentVersion,
                enrollmentEpoch: current.state.enrollmentEpoch,
                ...(received ? { receipt: received.receipt } : {}),
                stateProof: current.proof,
            },
            { adoptWithoutLease: received !== undefined }
        );
        if (adopted) return 'adopted';
        // Another request (an expired-lease settle) may already have persisted this
        // exact commit: Mongo then serves the authority's copy, nothing is left to do.
        const stored = await findUserKeyByAuthProvider(authProvider.type, authProvider.id);
        const persisted =
            stored !== null &&
            stored.escrowEnrollmentLease?.id !== lease.id &&
            (current.state.envelope
                ? stored.escrowBlob?.blobHash === escrowBlobIdentity(current.state.envelope)
                : !stored.escrowBlob);
        await releaseEscrowEnrollmentLease(authProvider, lease.id);
        // Otherwise Mongo moved past the blob this lease replaced (a rotation).
        return persisted ? 'adopted' : 'released';
    }
    if (!releaseIfUncommitted) return 'kept';
    await releaseEscrowEnrollmentLease(authProvider, lease.id);
    return 'released';
};
