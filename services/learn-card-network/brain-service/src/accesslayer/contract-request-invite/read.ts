import { int } from 'neo4j-driver';

import { neogma } from '@instance';

export type ContractRequestInviteStatus = 'pending' | 'attached' | 'cancelled' | 'expired';

/** Properties of a ContractRequestInvite node. `id` is the request ID the sender receives. */
export type ContractRequestInviteType = {
    id: string;
    email: string;
    requestedBy: string;
    externalReferenceId?: string | null;
    message?: string | null;
    requestedAt: string;
    expiresAt: string;
    tenantId?: string | null;
    status: ContractRequestInviteStatus;
    emailSentAt?: string | null;
    attachedProfileId?: string | null;
    attachedAt?: string | null;
};

const inviteViewerWhere = `($viewerProfileId IS NULL OR EXISTS {
    MATCH (c)-[:CREATED_BY|CAN_WRITE]->(:Profile {profileId: $viewerProfileId})
} OR (invite.requestedBy = $viewerProfileId AND EXISTS {
    MATCH (c)-[:SHARES_DATA_WITH]->(:Profile {profileId: $viewerProfileId})
}))`;

/**
 * Reads one invite of a contract. With `viewerProfileId`, it is returned only to contract
 * managers (owner, writers) and to its sender while the sender is a data recipient.
 */
export const getContractRequestInvite = async (
    contractId: string,
    inviteId: string,
    viewerProfileId?: string
): Promise<ContractRequestInviteType | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (c:ConsentFlowContract {id: $contractId})-[:HAS_REQUEST_INVITE]->(invite:ContractRequestInvite {id: $inviteId})
         WHERE ${inviteViewerWhere}
         RETURN properties(invite) AS invite`,
        { contractId, inviteId, viewerProfileId: viewerProfileId ?? null }
    );
    return result.records[0]?.get('invite') ?? null;
};

/** Invites of a contract that have not become a request: pending, cancelled or expired. */
export const getUnattachedContractRequestInvites = async (
    contractId: string,
    viewerProfileId: string
): Promise<ContractRequestInviteType[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (c:ConsentFlowContract {id: $contractId})-[:HAS_REQUEST_INVITE]->(invite:ContractRequestInvite)
         WHERE invite.status <> 'attached' AND ${inviteViewerWhere}
         RETURN properties(invite) AS invite ORDER BY invite.requestedAt, invite.id`,
        { contractId, viewerProfileId }
    );
    return result.records.map(record => record.get('invite'));
};

/** Profile IDs (at most 5) that have this already normalised email as a verified contact method. */
export const getProfileIdsWithVerifiedEmail = async (email: string): Promise<string[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (profile:Profile)-[:HAS_CONTACT_METHOD]->(cm:ContactMethod)
         WHERE cm.type = 'email' AND cm.isVerified = true AND toLower(trim(cm.value)) = $email
         RETURN DISTINCT profile.profileId AS profileId ORDER BY profileId LIMIT 5`,
        { email }
    );
    return result.records.map(record => record.get('profileId'));
};

/**
 * Pending, unexpired invites addressed to any verified email of the profile, oldest first.
 * Invites that can never attach are left out, so callers do not retry them on every call:
 * the profile's own invites, and invites for a contract that already has a request for the profile.
 */
export const getPendingContractRequestInvitesForProfile = async (
    profileId: string,
    limit: number
): Promise<{ contractId: string; invite: ContractRequestInviteType }[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (profile:Profile {profileId: $profileId})-[:HAS_CONTACT_METHOD]->(cm:ContactMethod)
         WHERE cm.type = 'email' AND cm.isVerified = true
         WITH profile, collect(DISTINCT toLower(trim(cm.value))) AS emails
         MATCH (contract:ConsentFlowContract)-[:HAS_REQUEST_INVITE]->(invite:ContractRequestInvite)
         WHERE invite.email IN emails AND invite.status = 'pending' AND invite.expiresAt > $now
             AND invite.requestedBy <> $profileId
             AND NOT EXISTS { MATCH (contract)-[:REQUESTED_FOR]->(profile) }
         RETURN contract.id AS contractId, properties(invite) AS invite
         ORDER BY invite.requestedAt, invite.id LIMIT $limit`,
        { profileId, now: new Date().toISOString(), limit: int(limit) }
    );
    return result.records.map(record => ({
        contractId: record.get('contractId'),
        invite: record.get('invite'),
    }));
};

/** Display name of the contract owner, for the invite email. */
export const getContractOwnerDisplayName = async (
    contractId: string
): Promise<string | undefined> => {
    const result = await neogma.queryRunner.run(
        `MATCH (:ConsentFlowContract {id: $contractId})-[:CREATED_BY]->(owner:Profile)
         RETURN owner.displayName AS displayName LIMIT 1`,
        { contractId }
    );
    return result.records[0]?.get('displayName') ?? undefined;
};

/** Pending invites whose expiry has passed, oldest first. */
export const getOverdueContractRequestInvites = async (
    limit: number
): Promise<{ contractId: string; inviteId: string }[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (contract:ConsentFlowContract)-[:HAS_REQUEST_INVITE]->(invite:ContractRequestInvite)
         WHERE invite.status = 'pending' AND invite.expiresAt <= $now
         RETURN contract.id AS contractId, invite.id AS inviteId
         ORDER BY invite.expiresAt, invite.id LIMIT $limit`,
        { now: new Date().toISOString(), limit: int(limit) }
    );
    return result.records.map(record => ({
        contractId: record.get('contractId'),
        inviteId: record.get('inviteId'),
    }));
};
