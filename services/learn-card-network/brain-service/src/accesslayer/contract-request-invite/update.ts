import { BindParam, QueryBuilder } from 'neogma';
import { int } from 'neo4j-driver';

import {
    lockContractAudience,
    runAudienceMutation,
} from '@accesslayer/consentflowcontract/relationships/recipients';
import {
    CONTRACT_REQUEST_INVITE_EMAIL_LIMIT,
    CONTRACT_REQUEST_INVITE_EMAIL_WINDOW_MS,
} from '@helpers/invite-email.helpers';

/**
 * Reserves the right to send the invite email, under the contract lock.
 * True at most once per invite, and at most CONTRACT_REQUEST_INVITE_EMAIL_LIMIT times per
 * contract and email address inside the window. The caller sends the email only when true.
 */
export const claimContractRequestInviteEmail = async (
    contractId: string,
    inviteId: string
): Promise<boolean> => {
    const now = new Date();
    const query = lockContractAudience(
        new QueryBuilder(
            new BindParam({
                inviteId,
                now: now.toISOString(),
                since: new Date(
                    now.getTime() - CONTRACT_REQUEST_INVITE_EMAIL_WINDOW_MS
                ).toISOString(),
                limit: int(CONTRACT_REQUEST_INVITE_EMAIL_LIMIT),
            })
        ),
        contractId
    ).raw(`
        MATCH (contract)-[:HAS_REQUEST_INVITE]->(invite:ContractRequestInvite {id: $inviteId})
        WHERE invite.status = 'pending' AND invite.emailSentAt IS NULL
        OPTIONAL MATCH (contract)-[:HAS_REQUEST_INVITE]->(sent:ContractRequestInvite)
            WHERE sent.email = invite.email AND sent.emailSentAt > $since
        WITH invite, count(sent) AS recent
        WHERE recent < $limit
        SET invite.emailSentAt = $now
        RETURN invite.id AS id
    `);
    return (await runAudienceMutation(query)).records.length > 0;
};

/**
 * Cancels a pending invite. Allowed for contract managers (owner, writers) and for the sender
 * while it is a data recipient. Cancelling an already cancelled invite succeeds again.
 * Returns false when there is no such invite, it is not pending, or the actor may not cancel.
 */
export const cancelContractRequestInvite = async (
    contractId: string,
    inviteId: string,
    actorProfileId: string
): Promise<boolean> => {
    const query = lockContractAudience(
        new QueryBuilder(
            new BindParam({ inviteId, actorProfileId, now: new Date().toISOString() })
        ),
        contractId
    ).raw(`
        MATCH (contract)-[:HAS_REQUEST_INVITE]->(invite:ContractRequestInvite {id: $inviteId})
        WHERE invite.status IN ['pending', 'cancelled'] AND
            (EXISTS { MATCH (contract)-[:CREATED_BY|CAN_WRITE]->(:Profile {profileId: $actorProfileId}) } OR
             (invite.requestedBy = $actorProfileId AND EXISTS {
                MATCH (contract)-[:SHARES_DATA_WITH]->(:Profile {profileId: $actorProfileId}) }))
        SET invite.status = 'cancelled', invite.cancelledAt = coalesce(invite.cancelledAt, $now)
        RETURN invite.id AS id
    `);
    return (await runAudienceMutation(query)).records.length > 0;
};
