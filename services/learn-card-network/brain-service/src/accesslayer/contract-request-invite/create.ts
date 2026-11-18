import { randomUUID } from 'node:crypto';
import { BindParam, QueryBuilder } from 'neogma';

import {
    lockContractAudience,
    runAudienceMutation,
} from '@accesslayer/consentflowcontract/relationships/recipients';
import {
    CONTRACT_REQUEST_INVITE_TTL_MS,
    normalizeInviteEmail,
} from '@helpers/invite-email.helpers';
import { defaultDomain } from '@helpers/integration-events.helpers';
import { inviteIntegrationEventCypher } from './events';
import type { ContractRequestInviteType } from './read';

export type CreateContractRequestInviteInput = {
    contractId: string;
    email: string;
    senderProfileId: string;
    externalReferenceId?: string | null;
    message?: string | null;
    tenantId?: string | null;
    /** Domain that integration event URIs are built on. Defaults to this service's domain. */
    domain?: string;
};

/**
 * Creates a pending invite, or returns the existing one for an identical retry.
 * A retry is identical when contract, email, sender, reference and message match and the earlier
 * invite is still pending, or is attached to a request that is still pending. That keeps the
 * answer the same whether or not the email belongs to an account.
 * A new invite also records the integration `request_sent` event (no subject), in the same
 * statement. Returns null when the sender has no role on the contract or the contract has expired.
 */
export const createContractRequestInvite = async (
    input: CreateContractRequestInviteInput
): Promise<{ invite: ContractRequestInviteType; created: boolean } | null> => {
    const now = new Date();
    const query = lockContractAudience(
        new QueryBuilder(
            new BindParam({
                id: randomUUID(),
                email: normalizeInviteEmail(input.email),
                senderProfileId: input.senderProfileId,
                externalReferenceId: input.externalReferenceId ?? null,
                message: input.message ?? null,
                tenantId: input.tenantId ?? null,
                eventDomain: input.domain ?? defaultDomain(),
                now: now.toISOString(),
                expiresAt: new Date(now.getTime() + CONTRACT_REQUEST_INVITE_TTL_MS).toISOString(),
            })
        ),
        input.contractId
    ).raw(`
        WITH contract WHERE EXISTS {
            MATCH (contract)-[:CREATED_BY|CAN_WRITE|SHARES_DATA_WITH]->(:Profile {profileId: $senderProfileId})
        } AND CASE WHEN contract.expiresAt IS NULL OR trim(contract.expiresAt) = '' THEN true ELSE datetime(contract.expiresAt) > datetime($now) END
        OPTIONAL MATCH (contract)-[:HAS_REQUEST_INVITE]->(existing:ContractRequestInvite)
            WHERE existing.email = $email AND existing.requestedBy = $senderProfileId AND
                coalesce(existing.externalReferenceId, '') = coalesce($externalReferenceId, '') AND
                coalesce(existing.message, '') = coalesce($message, '') AND
                ((existing.status = 'pending' AND existing.expiresAt > $now) OR
                 (existing.status = 'attached' AND EXISTS {
                    MATCH (contract)-[request:REQUESTED_FOR]->(:Profile)
                    WHERE request.requestId = existing.id AND request.status = 'pending'
                 }))
        WITH contract, existing ORDER BY existing.requestedAt DESC
        WITH contract, collect(existing)[0] AS existing
        FOREACH (_ IN CASE WHEN existing IS NULL THEN [1] ELSE [] END |
            CREATE (contract)-[:HAS_REQUEST_INVITE]->(created:ContractRequestInvite {id: $id})
            SET created += {email: $email, requestedBy: $senderProfileId,
                externalReferenceId: $externalReferenceId, message: $message,
                requestedAt: $now, expiresAt: $expiresAt, tenantId: $tenantId, domain: $eventDomain,
                status: 'pending'})
        WITH contract, existing
        MATCH (contract)-[:HAS_REQUEST_INVITE]->(invite:ContractRequestInvite)
            WHERE invite.id = coalesce(existing.id, $id)
        FOREACH (_ IN CASE WHEN existing IS NULL THEN [1] ELSE [] END |
            ${inviteIntegrationEventCypher('request_sent', 'invited')})
        RETURN properties(invite) AS invite, existing IS NULL AS created
    `);
    const record = (await runAudienceMutation(query)).records[0];
    if (!record) return null;
    return { invite: record.get('invite'), created: record.get('created') === true };
};
