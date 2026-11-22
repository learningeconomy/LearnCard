import { randomUUID } from 'node:crypto';
import { int } from 'neo4j-driver';
import { BindParam, QueryBuilder } from 'neogma';
import { TRPCError } from '@trpc/server';
import { neogma } from '@instance';
import { cancelContractRequestInvite } from '@accesslayer/contract-request-invite/update';
import type { SendContractRequest, SendContractRequestResult } from '@learncard/types';
import {
    getContractByUri,
    getContractRequestAccess,
    getStoredContractRequest,
} from '@accesslayer/consentflowcontract/read';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { getWritersForContract } from '@accesslayer/consentflowcontract/relationships/read';
import {
    canReadContractData,
    lockContractAudience,
    runAudienceMutation,
} from '@accesslayer/consentflowcontract/relationships/recipients';
import { getProfileIdFromString } from './did.helpers';
import { userHasRequiredScopes } from './auth-grant.helpers';
import { enforceRateLimits } from './rateLimit.helpers';
import {
    getContractRequestCap,
    getContractRequestCapWindowStart,
    recentContractRequestTimes,
} from './contract-request-cap.helpers';
import { contractRequestReplacementWhere } from './contract-request-replacement.helpers';
import {
    requestEventCypher,
    tryDispatchContractEvent,
    tryFanOutContractIntegrationEvents,
} from './contract-events.helpers';
import type { ProfileType } from 'types/profile';
import type { DbContractType } from 'types/consentflowcontract';

/** The contract exists and the profile may manage its requests. Throws otherwise. */
const authorizeContractRequestManager = async (
    contractUri: string,
    profile: ProfileType,
    allowRecipients: boolean
): Promise<DbContractType> => {
    const contract = await getContractByUri(contractUri);
    if (!contract) throw new TRPCError({ code: 'NOT_FOUND', message: 'Contract not found' });
    if (!(await canManageContractRequests(contract, profile.profileId, allowRecipients)))
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You do not have permission to send requests for this contract.',
        });
    return contract;
};

/** Resolves a profile ID or network DID to an existing profile. Throws NOT_FOUND otherwise. */
const resolveContractRequestTarget = async (
    targetIdentifier: string,
    domain: string
): Promise<ProfileType> => {
    const targetId = await getProfileIdFromString(targetIdentifier, domain);
    const target = targetId ? await getProfileByProfileId(targetId) : null;
    if (!target) throw new TRPCError({ code: 'NOT_FOUND', message: 'Target profile not found' });
    return target;
};

/** Resolve shared request inputs without granting writers access to consented data. */
export const resolveContractRequest = async (
    contractUri: string,
    targetIdentifier: string,
    profile: ProfileType,
    domain: string,
    allowRecipients = true
): Promise<{ contract: DbContractType; target: ProfileType }> => {
    const contract = await authorizeContractRequestManager(contractUri, profile, allowRecipients);
    return { contract, target: await resolveContractRequestTarget(targetIdentifier, domain) };
};

/**
 * Checks shared by every send: the contract exists, the sender may send, and the rate limit.
 * The limit is counted before anything about the target is looked up, so it reveals nothing.
 */
export const authorizeContractRequestSend = async (
    contractUri: string,
    profile: ProfileType
): Promise<DbContractType> => {
    const contract = await authorizeContractRequestManager(contractUri, profile, true);
    await enforceRateLimits([
        {
            key: `contract-request-rate:${contract.id}:${profile.profileId}`,
            limit: 500,
            windowSeconds: 3600,
            description: '500 contract requests per hour',
        },
    ]);
    return contract;
};

export const canManageContractRequests = async (
    contract: DbContractType,
    profileId: string,
    allowRecipients = false
): Promise<boolean> => {
    const access = await getContractRequestAccess(contract.id, profileId);
    return access.isManager || (allowRecipients && access.isRecipient);
};

export type CreateRequestForProfileInput = {
    contractId: string;
    targetProfileId: string;
    senderProfileId: string;
    /** Used for a new request, including replacements on an existing relationship. */
    requestId: string;
    externalReferenceId?: string | null;
    message?: string | null;
    domain: string;
    /** ID of the ContractRequestInvite this request converts. It equals `requestId`. */
    inviteId?: string | null;
};

/**
 * Creates or replaces the current request for a resolved profile under the contract lock.
 * Returns the existing ID for an exact pending retry, or a capped result when a new request
 * would exceed the rolling limit. An ineligible send returns null.
 */
export const createRequestForProfile = async (
    input: CreateRequestForProfileInput
): Promise<SendContractRequestResult | { status: 'capped' } | null> => {
    const now = new Date();
    const query = lockContractAudience(
        new QueryBuilder(
            new BindParam({
                targetProfileId: input.targetProfileId,
                senderProfileId: input.senderProfileId,
                requestId: input.requestId,
                externalReferenceId: input.externalReferenceId ?? null,
                message: input.message ?? null,
                inviteId: input.inviteId ?? null,
                now: now.toISOString(),
                capWindowStart: getContractRequestCapWindowStart(now),
                requestCap: int(getContractRequestCap()),
                domain: input.domain,
                eventFrom: input.senderProfileId,
                eventKind: 'request_sent',
            })
        ),
        input.contractId
    ).raw(`
        MATCH (target:Profile {profileId: $targetProfileId})
        WITH contract, target WHERE $targetProfileId <> $senderProfileId AND EXISTS {
            MATCH (contract)-[:CREATED_BY|CAN_WRITE|SHARES_DATA_WITH]->(:Profile {profileId: $senderProfileId})
        } AND CASE WHEN contract.expiresAt IS NULL OR trim(contract.expiresAt) = '' THEN true ELSE datetime(contract.expiresAt) > datetime($now) END
        AND NOT EXISTS {
            MATCH (target)-[:CREATED_BY]->(terms:ConsentFlowTerms)-[:CONSENTS_TO]->(contract)
            WHERE (terms.status = 'live' OR (terms.status = 'consumed' AND terms.oneTime = true)) AND
                CASE WHEN terms.expiresAt IS NULL OR trim(terms.expiresAt) = '' THEN true ELSE datetime(terms.expiresAt) > datetime($now) END
        }
        OPTIONAL MATCH (contract)-[existing:REQUESTED_FOR]->(target)
        WITH contract, target, existing,
            ${contractRequestReplacementWhere('$senderProfileId', '$inviteId IS NOT NULL')} AS replacing,
            coalesce($inviteId IS NULL AND existing.status = 'pending' AND existing.requestId IS NOT NULL AND
                coalesce(existing.addressedByEmail, false) = false AND
                existing.requestedBy = $senderProfileId AND
                coalesce(existing.externalReferenceId, '') = coalesce($externalReferenceId, '') AND
                coalesce(existing.message, '') = coalesce($message, ''), false) AS retry,
            ${recentContractRequestTimes} AS recentTimes
        WHERE existing IS NULL OR replacing OR retry
        OPTIONAL MATCH (contract)-[:HAS_REQUEST_INVITE]->(invite:ContractRequestInvite)
            WHERE invite.id = $inviteId
        WITH contract, target, existing, invite, retry, recentTimes
        WHERE $inviteId IS NULL OR (invite IS NOT NULL AND invite.status = 'pending' AND
            invite.expiresAt > $now AND NOT coalesce(invite.superseded, false))
        WITH contract, target, invite, retry, recentTimes,
            existing.requestId AS replacedId, existing.status AS replacedStatus,
            NOT retry AND size(recentTimes) >= $requestCap AS capped
        CALL {
            WITH contract, target, invite, retry, recentTimes, replacedId, replacedStatus, capped
            WITH contract, target, invite, retry, recentTimes, replacedId, replacedStatus WHERE NOT capped
            MERGE (contract)-[request:REQUESTED_FOR]->(target)
            FOREACH (_ IN CASE WHEN retry THEN [] ELSE [1] END |
                SET request += {requestId: $requestId, requestedBy: $senderProfileId,
                    externalReferenceId: $externalReferenceId, message: $message,
                    requestedAt: coalesce(invite.requestedAt, $now), status: 'pending', readStatus: 'unseen',
                    addressedByEmail: CASE WHEN $inviteId IS NULL THEN null ELSE true END,
                    expiresAt: invite.expiresAt, expiredAt: null, requestTimes: recentTimes + [$now]})
            FOREACH (_ IN CASE WHEN invite IS NULL THEN [] ELSE [1] END |
                SET invite.status = 'attached', invite.attachedProfileId = target.profileId,
                    invite.attachedAt = $now)
            WITH contract, request, target, retry, replacedId, replacedStatus
            OPTIONAL MATCH (contract)-[:HAS_REQUEST_INVITE]->(replaced:ContractRequestInvite)
                WHERE NOT retry AND replaced.id = replacedId
            FOREACH (_ IN CASE WHEN replaced IS NOT NULL AND replacedStatus <> 'accepted' THEN [1] ELSE [] END |
                SET replaced.attachedProfileId = null, replaced.attachedAt = null,
                    replaced.status = replacedStatus, replaced.superseded = true)
            FOREACH (_ IN CASE WHEN replaced IS NOT NULL AND replacedStatus = 'accepted' THEN [1] ELSE [] END |
                SET replaced.status = 'closed')
            ${requestEventCypher}
            UNION
            WITH capped
            WITH capped WHERE capped
            RETURN null AS request, null AS eventId
        }
        RETURN request, eventId
    `);
    const result = await runAudienceMutation(query);
    const record = result.records[0];
    if (!record) return null;
    if (!record.get('request')) return { status: 'capped' };
    await tryDispatchContractEvent(record.get('eventId'));
    const request = record.get('request').properties as { requestId: string };
    return { requestId: request.requestId, status: 'pending' };
};

/** Send to a resolved profile. Exact pending retries return the same request ID. */
export const sendGenericContractRequest = async (
    input: SendContractRequest,
    profile: ProfileType,
    domain: string
): Promise<SendContractRequestResult> => {
    const contract = await authorizeContractRequestSend(input.contractUri, profile);
    if (!input.targetProfileId)
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'targetProfileId is required' });
    const target = await resolveContractRequestTarget(input.targetProfileId, domain);
    if (target.profileId === profile.profileId)
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'You cannot send a request to yourself.',
        });
    const result = await createRequestForProfile({
        contractId: contract.id,
        targetProfileId: target.profileId,
        senderProfileId: profile.profileId,
        requestId: randomUUID(),
        externalReferenceId: input.externalReferenceId,
        message: input.message,
        domain,
    });
    if (!result)
        throw new TRPCError({
            code: 'CONFLICT',
            message:
                'Active consent or a conflicting request already exists, or the contract changed.',
        });
    if (result.status === 'capped')
        throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'This profile has reached the limit for contract requests in 30 days.',
        });
    return result;
};

/** Target-only denial; cancellation also permits owner/writers and the requesting recipient. */
export const decideGenericContractRequest = async ({
    contract,
    targetProfileId,
    actorProfileId,
    status,
    domain,
    requestId,
}: {
    contract: DbContractType;
    targetProfileId: string;
    actorProfileId: string;
    status: 'denied' | 'cancelled';
    domain: string;
    /** The request ID supplied by callers that address a request by ID. */
    requestId?: string;
}): Promise<boolean> => {
    const request = await getStoredContractRequest(contract.id, targetProfileId);
    if (!request?.requestId)
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Contract request not found' });
    if (requestId && request.requestId !== requestId)
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'Request already decided or permission changed',
        });
    const isTarget = actorProfileId === targetProfileId;
    const writers = await getWritersForContract(contract);
    const authorized =
        isTarget ||
        (status === 'cancelled' &&
            (writers.some(profile => profile.profileId === actorProfileId) ||
                (request.requestedBy === actorProfileId &&
                    (await canReadContractData(contract.id, actorProfileId)))));
    if (!authorized)
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You cannot change this request' });
    const result = await runAudienceMutation(
        lockContractAudience(
            new QueryBuilder(
                new BindParam({
                    targetProfileId,
                    actorProfileId,
                    status,
                    domain,
                    now: new Date().toISOString(),
                    eventKind: status === 'denied' ? 'request_denied' : 'request_cancelled',
                    eventFrom: actorProfileId,
                    requestId: request.requestId,
                })
            ),
            contract.id
        ).raw(`
        MATCH (contract)-[request:REQUESTED_FOR]->(target:Profile {profileId: $targetProfileId})
        WHERE request.requestId = $requestId AND request.status IN ['pending', $status]
            AND (request.status = $status OR request.expiresAt IS NULL OR request.expiresAt > $now)
            AND ($actorProfileId = $targetProfileId OR ($status = 'cancelled' AND
                (EXISTS { MATCH (contract)-[:CREATED_BY|CAN_WRITE]->(:Profile {profileId: $actorProfileId}) } OR
                 (request.requestedBy = $actorProfileId AND EXISTS {
                    MATCH (contract)-[:SHARES_DATA_WITH]->(:Profile {profileId: $actorProfileId}) }))))
        SET request.status = $status
        ${requestEventCypher}
    `)
    );
    if (!result.records.length)
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'Request already decided or permission changed',
        });
    await tryDispatchContractEvent(result.records[0]!.get('eventId'));
    return true;
};

/** Cancels by request ID. Unknown IDs and callers without permission both get NOT_FOUND. */
export const cancelContractRequestById = async ({
    contract,
    requestId,
    actorProfileId,
    domain,
}: {
    contract: DbContractType;
    requestId: string;
    actorProfileId: string;
    domain: string;
}): Promise<boolean> => {
    const notFound = new TRPCError({ code: 'NOT_FOUND', message: 'Contract request not found' });
    const findTarget = async (): Promise<string | undefined> =>
        (
            await neogma.queryRunner.run(
                `MATCH (:ConsentFlowContract {id: $contractId})-[request:REQUESTED_FOR]->(target:Profile)
                 WHERE request.requestId = $requestId
                 RETURN target.profileId AS targetProfileId`,
                { contractId: contract.id, requestId }
            )
        ).records[0]?.get('targetProfileId');
    // Two rounds: the ID can move between the read and the locked write, when an invite attaches
    // or when a newer request replaces the one with this ID. Each round resolves the ID again.
    for (let round = 0; round < 2; round += 1) {
        const targetProfileId = await findTarget();
        if (!targetProfileId) {
            // No profile holds this ID: the request is still an invite addressed to an email.
            const outcome = await cancelContractRequestInvite(
                contract.id,
                requestId,
                actorProfileId,
                domain
            );
            if (outcome === 'cancelled') {
                await tryFanOutContractIntegrationEvents(contract.id);
                return true;
            }
            // Same answer as an attached request that can no longer be cancelled.
            if (outcome === 'expired')
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Request already decided or permission changed',
                });
            continue;
        }
        try {
            return await decideGenericContractRequest({
                contract,
                targetProfileId,
                actorProfileId,
                status: 'cancelled',
                domain,
                requestId,
            });
        } catch (error) {
            if (error instanceof TRPCError && error.code === 'UNAUTHORIZED') throw notFound;
            if (
                error instanceof TRPCError &&
                error.code === 'CONFLICT' &&
                (await findTarget()) !== targetProfileId
            )
                continue;
            throw error;
        }
    }
    throw notFound;
};

export const markGenericContractRequestSeen = async (
    contractId: string,
    targetProfileId: string
): Promise<boolean> => {
    const result = await runAudienceMutation(
        lockContractAudience(new QueryBuilder(new BindParam({ targetProfileId })), contractId)
            .raw(`MATCH (contract)-[request:REQUESTED_FOR]->(:Profile {profileId: $targetProfileId})
            WHERE request.requestId IS NOT NULL
            SET request.readStatus = 'seen' RETURN request`)
    );
    if (!result.records.length)
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Request not found' });
    return true;
};

/** Legacy request mutations retain their scope behavior; attributed requests require write. */
export const assertGenericRequestWriteScope = (scope?: string): void => {
    if (!userHasRequiredScopes(scope ?? '', 'contracts:write'))
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'This operation requires contracts:write scope',
        });
};
