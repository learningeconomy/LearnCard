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
 * `leased`: another worker holds a live lease; leave the invite queued so it can be retaken.
 * `refused`: the email was sent, the invite is no longer pending, or the address hit its limit.
 */
export const claimContractRequestInviteEmail = async (
    contractId: string,
    inviteId: string
): Promise<'claimed' | 'leased' | 'refused'> => {
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
        WHERE invite.status = 'pending'
        WITH contract, invite,
            (invite.emailSentAt IS NULL OR
                (invite.deliveryPending = true AND invite.emailSentAt <= $staleBefore)) AS free
        OPTIONAL MATCH (contract)-[:HAS_REQUEST_INVITE]->(sent:ContractRequestInvite)
            WHERE sent <> invite AND sent.email = invite.email AND sent.emailSentAt > $since
        WITH invite, free, count(sent) AS recent
        WITH invite, free AND recent < $limit AS claim,
            NOT free AND coalesce(invite.deliveryPending, false) = true AS leased
        FOREACH (_ IN CASE WHEN claim THEN [1] ELSE [] END |
            SET invite.emailSentAt = $now, invite.deliveryNextAt = $leaseUntil)
        RETURN CASE WHEN claim THEN 'claimed' WHEN leased THEN 'leased' ELSE 'refused' END AS outcome
    `);
    const record = (await runAudienceMutation(query)).records[0];
    return record?.get('outcome') ?? 'refused';
};

/** What cancelling an invite did. */
export type ContractRequestInviteCancelOutcome = 'cancelled' | 'decided' | 'missing';

/**
 * Cancels a pending invite. Allowed for contract managers (owner, writers) and for the sender
 * while it is a data recipient. Cancelling an already cancelled invite succeeds again. An invite
 * past its expiry or already denied is `decided` and stays as it is, like an attached request.
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
        WHERE invite.status IN ['pending', 'cancelled', 'expired', 'denied'] AND
            (EXISTS { MATCH (contract)-[:CREATED_BY|CAN_WRITE]->(:Profile {profileId: $actorProfileId}) } OR
             (invite.requestedBy = $actorProfileId AND EXISTS {
                MATCH (contract)-[:SHARES_DATA_WITH]->(:Profile {profileId: $actorProfileId}) }))
        WITH contract, invite,
            invite.status IN ['expired', 'denied'] OR (invite.status = 'pending' AND invite.expiresAt <= $now) AS decided
        FOREACH (_ IN CASE WHEN decided THEN [] ELSE [1] END |
            SET invite.status = 'cancelled', invite.cancelledAt = coalesce(invite.cancelledAt, $now)
            ${inviteIntegrationEventCypher('request_cancelled', 'cancelled')})
        RETURN CASE WHEN decided THEN 'decided' ELSE 'cancelled' END AS outcome
    `);
    const outcome = (await runAudienceMutation(query)).records[0]?.get('outcome');
    return outcome === 'cancelled' || outcome === 'decided' ? outcome : 'missing';
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
        OPTIONAL MATCH (contract)-[request:REQUESTED_FOR|PENDING_EMAIL_REQUEST]->(:Profile)
            WHERE invite.status = 'attached' AND request.requestId = invite.id
        WITH contract, invite, request,
            invite.status = 'pending' OR coalesce(request.status = 'pending', false) AS expires
        SET invite.status = CASE WHEN expires THEN 'expired' ELSE 'closed' END,
            invite.expiredAt = CASE WHEN expires THEN $now ELSE invite.expiredAt END
        FOREACH (_ IN CASE WHEN expires AND request IS NOT NULL THEN [1] ELSE [] END |
            SET request.status = 'expired', request.expiredAt = $now)
        FOREACH (_ IN CASE WHEN expires THEN [1] ELSE [] END |
            ${inviteIntegrationEventCypher('request_expired', 'expired')})
        FOREACH (_ IN CASE WHEN type(request) = 'PENDING_EMAIL_REQUEST' THEN [1] ELSE [] END |
            SET invite += {status: request.status, attachedProfileId: null, attachedAt: null}
            DELETE request)
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
