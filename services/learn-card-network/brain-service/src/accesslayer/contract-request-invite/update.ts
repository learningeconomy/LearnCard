import { BindParam, QueryBuilder } from 'neogma';
import { neogma } from '@instance';
import { int } from 'neo4j-driver';

import {
    lockContractAudience,
    runAudienceMutation,
} from '@accesslayer/consentflowcontract/relationships/recipients';
import {
    CONTRACT_REQUEST_INVITE_EMAIL_LIMIT,
    CONTRACT_REQUEST_INVITE_EMAIL_WINDOW_MS,
    CONTRACT_REQUEST_INVITE_EMAIL_CLAIM_MS,
} from '@helpers/invite-email.helpers';
import { defaultDomain } from '@helpers/integration-events.helpers';
import { inviteIntegrationEventCypher } from './events';
import type { ContractRequestInviteType } from './read';

/**
 * Reserves the right to send the invite email, under the contract lock, and pushes the invite's
 * next delivery attempt to the end of a short lease. True at most
 * CONTRACT_REQUEST_INVITE_EMAIL_LIMIT times per contract and email address inside the window.
 * The caller sends the email only when true, then finishes delivery or releases the claim.
 * A claim the worker never finished or released (it stopped mid-send) can be taken again once
 * the lease has passed, so an interrupted send is retried rather than lost.
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
                staleBefore: new Date(
                    now.getTime() - CONTRACT_REQUEST_INVITE_EMAIL_CLAIM_MS
                ).toISOString(),
                leaseUntil: new Date(
                    now.getTime() + CONTRACT_REQUEST_INVITE_EMAIL_CLAIM_MS
                ).toISOString(),
                limit: int(CONTRACT_REQUEST_INVITE_EMAIL_LIMIT),
            })
        ),
        contractId
    ).raw(`
        MATCH (contract)-[:HAS_REQUEST_INVITE]->(invite:ContractRequestInvite {id: $inviteId})
        WHERE invite.status = 'pending' AND (invite.emailSentAt IS NULL OR
            (invite.deliveryPending = true AND invite.emailSentAt <= $staleBefore))
        OPTIONAL MATCH (contract)-[:HAS_REQUEST_INVITE]->(sent:ContractRequestInvite)
            WHERE sent <> invite AND sent.email = invite.email AND sent.emailSentAt > $since
        WITH invite, count(sent) AS recent
        WHERE recent < $limit
        SET invite.emailSentAt = $now, invite.deliveryNextAt = $leaseUntil
        RETURN invite.id AS id
    `);
    return (await runAudienceMutation(query)).records.length > 0;
};

/** What cancelling an invite did. */
export type ContractRequestInviteCancelOutcome = 'cancelled' | 'expired' | 'missing';

/**
 * Cancels a pending invite. Allowed for contract managers (owner, writers) and for the sender
 * while it is a data recipient. Cancelling an already cancelled invite succeeds again. An invite
 * past its expiry is `expired` and stays as it is, like an attached request past the same date.
 * The first cancel records the integration `request_cancelled` event (no subject) in the same
 * statement. `missing`: there is no such unattached invite, or the actor may not cancel it.
 */
export const cancelContractRequestInvite = async (
    contractId: string,
    inviteId: string,
    actorProfileId: string,
    domain: string = defaultDomain()
): Promise<ContractRequestInviteCancelOutcome> => {
    const query = lockContractAudience(
        new QueryBuilder(
            new BindParam({
                inviteId,
                actorProfileId,
                eventDomain: domain,
                now: new Date().toISOString(),
            })
        ),
        contractId
    ).raw(`
        MATCH (contract)-[:HAS_REQUEST_INVITE]->(invite:ContractRequestInvite {id: $inviteId})
        WHERE invite.status IN ['pending', 'cancelled', 'expired'] AND
            (EXISTS { MATCH (contract)-[:CREATED_BY|CAN_WRITE]->(:Profile {profileId: $actorProfileId}) } OR
             (invite.requestedBy = $actorProfileId AND EXISTS {
                MATCH (contract)-[:SHARES_DATA_WITH]->(:Profile {profileId: $actorProfileId}) }))
        WITH contract, invite,
            invite.status = 'expired' OR (invite.status = 'pending' AND invite.expiresAt <= $now) AS overdue
        FOREACH (_ IN CASE WHEN overdue THEN [] ELSE [1] END |
            SET invite.status = 'cancelled', invite.cancelledAt = coalesce(invite.cancelledAt, $now)
            ${inviteIntegrationEventCypher('request_cancelled', 'cancelled')})
        RETURN CASE WHEN overdue THEN 'expired' ELSE 'cancelled' END AS outcome
    `);
    const outcome = (await runAudienceMutation(query)).records[0]?.get('outcome');
    return outcome === 'cancelled' || outcome === 'expired' ? outcome : 'missing';
};

/**
 * Handles one invite past its expiry, under the contract lock. A pending invite, and an attached
 * one whose request is still pending, become `expired` (the request too) and record the
 * integration `request_expired` event (no subject) in the same statement, so the outcome does
 * not depend on whether the invite reached an account. An attached invite whose request was
 * already decided is marked `closed`, so the daily scan does not see it again.
 * Returns the invite when it expired, or null.
 */
export const expireContractRequestInvite = async (
    contractId: string,
    inviteId: string
): Promise<ContractRequestInviteType | null> => {
    const query = lockContractAudience(
        new QueryBuilder(
            new BindParam({ inviteId, eventDomain: defaultDomain(), now: new Date().toISOString() })
        ),
        contractId
    ).raw(`
        MATCH (contract)-[:HAS_REQUEST_INVITE]->(invite:ContractRequestInvite {id: $inviteId})
        WHERE invite.status IN ['pending', 'attached'] AND invite.expiresAt <= $now
        OPTIONAL MATCH (contract)-[request:REQUESTED_FOR]->(:Profile)
            WHERE invite.status = 'attached' AND request.requestId = invite.id
        WITH contract, invite, request,
            invite.status = 'pending' OR coalesce(request.status = 'pending', false) AS expires
        SET invite.status = CASE WHEN expires THEN 'expired' ELSE 'closed' END,
            invite.expiredAt = CASE WHEN expires THEN $now ELSE invite.expiredAt END
        FOREACH (_ IN CASE WHEN expires AND request IS NOT NULL THEN [1] ELSE [] END |
            SET request.status = 'expired', request.expiredAt = $now)
        FOREACH (_ IN CASE WHEN expires THEN [1] ELSE [] END |
            ${inviteIntegrationEventCypher('request_expired', 'expired')})
        RETURN properties(invite) AS invite, expires
    `);
    const record = (await runAudienceMutation(query)).records[0];
    return record?.get('expires') === true ? record.get('invite') : null;
};

/** Gives back an email claim whose delivery failed, so a later attempt can send it. */
export const releaseContractRequestInviteEmail = async (
    contractId: string,
    inviteId: string
): Promise<void> => {
    const query = lockContractAudience(new QueryBuilder(new BindParam({ inviteId })), contractId)
        .raw(`
        MATCH (contract)-[:HAS_REQUEST_INVITE]->(invite:ContractRequestInvite {id: $inviteId})
        SET invite.emailSentAt = null
        RETURN invite.id AS id
    `);
    await runAudienceMutation(query);
};

/** Ends delivery work for an invite: it attached, was emailed, or there is nothing left to do. */
export const finishContractRequestInviteDelivery = async (inviteId: string): Promise<void> => {
    await neogma.queryRunner.run(
        `MATCH (invite:ContractRequestInvite {id: $inviteId})
         REMOVE invite.deliveryPending, invite.deliveryNextAt`,
        { inviteId }
    );
};

/** Schedules another delivery attempt after a failure. */
export const retryContractRequestInviteDelivery = async (
    inviteId: string,
    nextAt: string
): Promise<void> => {
    await neogma.queryRunner.run(
        `MATCH (invite:ContractRequestInvite {id: $inviteId})
         SET invite.deliveryNextAt = $nextAt,
             invite.deliveryAttempts = coalesce(invite.deliveryAttempts, 0) + 1`,
        { inviteId, nextAt }
    );
};
