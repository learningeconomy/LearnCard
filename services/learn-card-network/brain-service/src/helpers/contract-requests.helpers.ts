import { randomUUID } from 'node:crypto';
import { BindParam, QueryBuilder } from 'neogma';
import { TRPCError } from '@trpc/server';
import type { SendContractRequest } from '@learncard/types';
import { getContractByUri, getStoredContractRequest } from '@accesslayer/consentflowcontract/read';
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
import { requestEventCypher, tryDispatchContractEvent } from './contract-events.helpers';
import type { ProfileType } from 'types/profile';
import type { DbContractType } from 'types/consentflowcontract';

/** Resolve shared request inputs without granting writers access to consented data. */
export const resolveContractRequest = async (
    contractUri: string,
    targetIdentifier: string,
    profile: ProfileType,
    domain: string,
    allowRecipients = true
): Promise<{ contract: DbContractType; target: ProfileType }> => {
    const contract = await getContractByUri(contractUri);
    if (!contract) throw new TRPCError({ code: 'NOT_FOUND', message: 'Contract not found' });
    if (!(await canManageContractRequests(contract, profile.profileId, allowRecipients)))
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You do not have permission to send requests for this contract.',
        });
    const targetId = await getProfileIdFromString(targetIdentifier, domain);
    const target = targetId ? await getProfileByProfileId(targetId) : null;
    if (!target) throw new TRPCError({ code: 'NOT_FOUND', message: 'Target profile not found' });
    return { contract, target };
};

export const canManageContractRequests = async (
    contract: DbContractType,
    profileId: string,
    allowRecipients = true
): Promise<boolean> =>
    (await getWritersForContract(contract)).some(profile => profile.profileId === profileId) ||
    (allowRecipients && (await canReadContractData(contract.id, profileId)));

/** One request per contract/target in v1. Exact pending retries do not create another event. */
export const sendGenericContractRequest = async (
    input: SendContractRequest,
    profile: ProfileType,
    domain: string
): Promise<boolean> => {
    const { contract, target } = await resolveContractRequest(
        input.contractUri,
        input.targetProfileId,
        profile,
        domain
    );
    await enforceRateLimits([
        {
            key: `contract-request-rate:${contract.id}:${profile.profileId}`,
            limit: 500,
            windowSeconds: 3600,
            description: '500 contract requests per hour',
        },
    ]);
    const requestId = randomUUID();
    const query = lockContractAudience(
        new QueryBuilder(
            new BindParam({
                targetProfileId: target.profileId,
                senderProfileId: profile.profileId,
                requestId,
                externalReferenceId: input.externalReferenceId ?? null,
                message: input.message ?? null,
                now: new Date().toISOString(),
                domain,
                eventFrom: profile.profileId,
                eventKind: 'request_sent',
            })
        ),
        contract.id
    ).raw(`
        MATCH (target:Profile {profileId: $targetProfileId})
        WITH contract, target WHERE EXISTS {
            MATCH (contract)-[:CREATED_BY|CAN_WRITE|SHARES_DATA_WITH]->(:Profile {profileId: $senderProfileId})
        } AND CASE WHEN contract.expiresAt IS NULL OR trim(contract.expiresAt) = '' THEN true ELSE datetime(contract.expiresAt) > datetime($now) END
        AND NOT EXISTS {
            MATCH (target)-[:CREATED_BY]->(terms:ConsentFlowTerms)-[:CONSENTS_TO]->(contract)
            WHERE (terms.status = 'live' OR (terms.status = 'stale' AND terms.oneTime = true)) AND
                CASE WHEN terms.expiresAt IS NULL OR trim(terms.expiresAt) = '' THEN true ELSE datetime(terms.expiresAt) > datetime($now) END
        }
        OPTIONAL MATCH (contract)-[existing:REQUESTED_FOR]->(target)
        WITH contract, target, existing WHERE existing IS NULL OR
            (existing.status = 'pending' AND existing.requestId IS NOT NULL AND
                existing.requestedBy = $senderProfileId AND
                coalesce(existing.externalReferenceId, '') = coalesce($externalReferenceId, '') AND
                coalesce(existing.message, '') = coalesce($message, ''))
        MERGE (contract)-[request:REQUESTED_FOR]->(target)
        ON CREATE SET request += {requestId: $requestId, requestedBy: $senderProfileId,
            externalReferenceId: $externalReferenceId, message: $message,
            requestedAt: $now, status: 'pending', readStatus: 'unseen'}
        ${requestEventCypher}
    `);
    const result = await runAudienceMutation(query);
    if (!result.records.length)
        throw new TRPCError({
            code: 'CONFLICT',
            message:
                'Active consent or a conflicting/terminal request already exists, or the contract changed.',
        });
    await tryDispatchContractEvent(result.records[0]!.get('eventId'));
    return true;
};

/** Target-only denial; cancellation also permits owner/writers and the requesting recipient. */
export const decideGenericContractRequest = async ({
    contract,
    targetProfileId,
    actorProfileId,
    status,
    domain,
}: {
    contract: DbContractType;
    targetProfileId: string;
    actorProfileId: string;
    status: 'denied' | 'cancelled';
    domain: string;
}): Promise<boolean> => {
    const request = await getStoredContractRequest(contract.id, targetProfileId);
    if (!request?.requestId)
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Contract request not found' });
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
                })
            ),
            contract.id
        ).raw(`
        MATCH (contract)-[request:REQUESTED_FOR]->(target:Profile {profileId: $targetProfileId})
        WHERE request.requestId IS NOT NULL AND request.status IN ['pending', $status]
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
