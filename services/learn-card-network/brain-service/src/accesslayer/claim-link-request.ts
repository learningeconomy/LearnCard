import { createHash, randomUUID } from 'node:crypto';
import type { ClaimLinkRequestStatus } from '@learncard/types';
import { neogma } from '@instance';
import { getCredentialById } from '@accesslayer/credential/read';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { getCredentialReceivedByProfile } from '@accesslayer/credential/relationships/read';
import { acceptCredential, getCredentialUri } from '@helpers/credential.helpers';

export interface ClaimLinkRequestInput {
    profileId: string;
    boostUri: string;
    challenge: string;
    requestId: string;
    domain: string;
}

interface ClaimLinkRequestRecord extends ClaimLinkRequestInput {
    id: string;
    credentialId: string;
    issuerProfileId: string;
    ownerToken: string;
    handlerActive: boolean;
    status: 'pending' | 'complete';
    claimLinkGeneration?: string;
}

export const getClaimLinkRequestCredentialId = (
    profileId: string,
    boostUri: string,
    challenge: string,
    requestId: string
): string =>
    createHash('sha256')
        .update(JSON.stringify([profileId, boostUri, challenge, requestId]))
        .digest('hex');

/** The authenticated profile's write lock serializes reservations across service processes. */
export const reserveClaimLinkRequest = async (
    input: ClaimLinkRequestInput & {
        issuerProfileId: string;
        ownerToken: string;
        claimLinkGeneration?: string;
    }
): Promise<{ acquired: boolean }> => {
    const id = getClaimLinkRequestCredentialId(
        input.profileId,
        input.boostUri,
        input.challenge,
        input.requestId
    );
    const session = neogma.driver.session();
    try {
        return await session.executeWrite(async tx => {
            // Without the optional uniqueness index, concurrent MERGE statements can duplicate
            // even one request ID. Hold this Profile's write lock through receipt reservation.
            const locked = await tx.run(
                `MATCH (p:Profile {profileId: $profileId})
                 SET p.claimLinkRequestLock = true
                 REMOVE p.claimLinkRequestLock
                 RETURN p.profileId`,
                { profileId: input.profileId }
            );
            if (!locked.records.length) throw new Error('Claim recipient is no longer available');
            const result = await tx.run(
                `MERGE (r:ClaimLinkRequest {id: $id})
                 ON CREATE SET r.profileId = $profileId, r.issuerProfileId = $issuerProfileId,
                    r.boostUri = $boostUri, r.challenge = $challenge, r.requestId = $requestId,
                    r.credentialId = $id, r.claimLinkGeneration = $claimLinkGeneration,
                    r.status = 'pending', r.createdAt = timestamp(),
                    r.ownerToken = $ownerToken, r.handlerActive = true
                 RETURN r.ownerToken AS ownerToken, r.status AS status`,
                { ...input, claimLinkGeneration: input.claimLinkGeneration ?? null, id }
            );
            return {
                acquired:
                    result.records[0]?.get('ownerToken') === input.ownerToken &&
                    result.records[0]?.get('status') === 'pending',
            };
        });
    } finally {
        await session.close();
    }
};

/** Only a finished handler can release ownership. Uncertain storage never permits another signing. */
export const releaseClaimLinkRequestOwner = async (
    input: ClaimLinkRequestInput & { ownerToken: string },
    beforeStorage = false
): Promise<void> => {
    const id = getClaimLinkRequestCredentialId(
        input.profileId,
        input.boostUri,
        input.challenge,
        input.requestId
    );
    if (beforeStorage) {
        await neogma.queryRunner.run(
            `MATCH (r:ClaimLinkRequest {id: $id, profileId: $profileId, ownerToken: $ownerToken, status: 'pending'})
             WHERE NOT EXISTS { MATCH (:Credential {id: r.credentialId}) }
             DELETE r`,
            { id, profileId: input.profileId, ownerToken: input.ownerToken }
        );
    }
    await neogma.queryRunner.run(
        `MATCH (r:ClaimLinkRequest {id: $id, profileId: $profileId, ownerToken: $ownerToken, status: 'pending'})
         SET r.handlerActive = false`,
        { id, profileId: input.profileId, ownerToken: input.ownerToken }
    );
};

type ConsumeClaimLink = (
    boostUri: string,
    challenge: string,
    usageId: string,
    expectedGeneration?: string
) => Promise<boolean | undefined>;

/** Reconcile a persisted claim before any caller considers repeating issuance. Never take over by age. */
export const recoverClaimLinkRequest = async (
    input: ClaimLinkRequestInput,
    consume: ConsumeClaimLink
): Promise<ClaimLinkRequestStatus> => {
    const id = getClaimLinkRequestCredentialId(
        input.profileId,
        input.boostUri,
        input.challenge,
        input.requestId
    );
    const result = await neogma.queryRunner.run(
        `MATCH (r:ClaimLinkRequest {id: $id, profileId: $profileId}) RETURN r`,
        { id, profileId: input.profileId }
    );
    const record = result.records[0]?.get('r').properties as ClaimLinkRequestRecord | undefined;
    if (!record) return { status: 'absent' };
    if (!(await getCredentialById(record.credentialId))) return { status: 'pending' };
    const credentialUri = getCredentialUri(record.credentialId, input.domain);
    if (record.status === 'complete') return { status: 'complete', credentialUri };

    const profile = await getProfileByProfileId(input.profileId);
    if (!profile) return { status: 'pending' };
    const received = await getCredentialReceivedByProfile(record.credentialId, profile);
    let recoveryOwner: string | undefined;
    if (!received) {
        // A running sender owns acceptance. An interrupted client is not evidence that it stopped.
        if (record.handlerActive) return { status: 'pending' };
        recoveryOwner = randomUUID();
        const ownership = await neogma.queryRunner.run(
            `MATCH (r:ClaimLinkRequest {id: $id, profileId: $profileId, status: 'pending'})
             SET r.recoveryLock = true
             REMOVE r.recoveryLock
             WITH r WHERE r.handlerActive = false AND r.status = 'pending'
             SET r.handlerActive = true, r.ownerToken = $ownerToken
             RETURN r.ownerToken AS ownerToken`,
            { id, profileId: input.profileId, ownerToken: recoveryOwner }
        );
        if (ownership.records[0]?.get('ownerToken') !== recoveryOwner) return { status: 'pending' };
    }
    try {
        // Reuse existing acceptance checks, hooks and permissions rather than constructing a received edge.
        if (!received) await acceptCredential(profile, credentialUri, { skipNotification: true });
        const consumed = await consume(
            record.boostUri,
            record.challenge,
            record.credentialId,
            record.claimLinkGeneration
        );
        if (!consumed) throw new Error('Claim-link usage could not be confirmed');
        const completed = await neogma.queryRunner.run(
            `MATCH (r:ClaimLinkRequest {id: $id, profileId: $profileId})
             MATCH (:Credential {id: r.credentialId})-[:CREDENTIAL_RECEIVED]->(:Profile {profileId: $profileId})
             SET r.status = 'complete', r.handlerActive = false, r.completedAt = timestamp()
             RETURN r.id AS id`,
            { id, profileId: input.profileId }
        );
        if (!completed.records.length) return { status: 'pending' };
        return { status: 'complete', credentialUri };
    } finally {
        if (recoveryOwner)
            await releaseClaimLinkRequestOwner({ ...input, ownerToken: recoveryOwner });
    }
};
