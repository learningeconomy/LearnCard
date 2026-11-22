import { int } from 'neo4j-driver';
import { BindParam, QueryBuilder } from 'neogma';

import {
    audienceVersionWhere,
    lockContractAudience,
    runAudienceMutation,
} from '@accesslayer/consentflowcontract/relationships/recipients';
import { termsReferralSnapshotCypher } from './consent-referral.helpers';
import { tryDispatchContractEvent } from './contract-events.helpers';
import type { CreateRequestForProfileInput } from './contract-requests.helpers';
import {
    contractRequestCountForSender,
    getContractRequestCap,
    getContractRequestCapWindowStart,
    recentContractRequestTimes,
} from './contract-request-cap.helpers';
import {
    activeRequestTermsWhere,
    contractRequestReplacementWhere,
    detachReplacedRequestInviteCypher,
    liveReferralSenderWhere,
    newLiveReferralReferenceWhere,
} from './contract-request-replacement.helpers';

type AcceptLiveReferralInput = {
    contractId: string;
    targetProfileId: string;
    requestId: string;
    audienceVersion?: number;
    domain: string;
};

type LiveReferralResult =
    | {
          status: 'accepted';
          requestId: string;
          termsId: string;
      }
    | { status: 'capped' };

const applyLiveReferral = async (
    input: CreateRequestForProfileInput | AcceptLiveReferralInput
): Promise<LiveReferralResult | null> => {
    const now = new Date();
    const direct = 'senderProfileId' in input;
    const query = lockContractAudience(
        new QueryBuilder(
            new BindParam({
                direct,
                targetProfileId: input.targetProfileId,
                requestId: input.requestId,
                senderProfileId: direct ? input.senderProfileId : null,
                externalReferenceId: direct ? (input.externalReferenceId ?? null) : null,
                message: direct ? (input.message ?? null) : null,
                audienceVersion:
                    direct || input.audienceVersion === undefined
                        ? null
                        : int(input.audienceVersion),
                capWindowStart: getContractRequestCapWindowStart(now),
                requestCap: int(getContractRequestCap()),
                now: now.toISOString(),
                domain: input.domain,
            })
        ),
        input.contractId
    ).raw(`
        WITH contract, datetime.realtime() AS lockedAt
        MATCH (target:Profile {profileId: $targetProfileId})-[:CREATED_BY]->(terms:ConsentFlowTerms)-[:CONSENTS_TO]->(contract)
        WHERE ${activeRequestTermsWhere('lockedAt')}
            AND coalesce(contract.status, 'active') <> 'retired'
            AND CASE WHEN contract.expiresAt IS NULL OR trim(contract.expiresAt) = '' THEN true
                     ELSE datetime(contract.expiresAt) > lockedAt END
            AND ($direct OR ${audienceVersionWhere})
        OPTIONAL MATCH (contract)-[existing:REQUESTED_FOR]->(target)
        WITH contract, target, terms, existing, lockedAt,
            CASE WHEN $direct THEN $senderProfileId ELSE existing.requestedBy END AS sender,
            CASE WHEN $direct THEN $externalReferenceId ELSE existing.externalReferenceId END AS reference
        WHERE sender <> $targetProfileId AND ${liveReferralSenderWhere('sender')}
            AND EXISTS {
                MATCH (contract)-[:CREATED_BY|CAN_WRITE|SHARES_DATA_WITH]->(:Profile {profileId: sender})
            }
        WITH contract, target, terms, existing, sender, reference, lockedAt,
            coalesce(terms.lastConsentTransactionId, terms.id) AS referralConsentId,
            coalesce(existing.liveReferral = true AND existing.status = 'accepted'
                AND existing.requestId = terms.\`referral.requestId\`
                AND CASE WHEN $direct THEN NOT coalesce(existing.addressedByEmail, false)
                    AND existing.requestedBy = sender AND existing.externalReferenceId = reference
                    AND coalesce(existing.message, '') = coalesce($message, '')
                    ELSE existing.addressedByEmail = true AND existing.requestId = $requestId END, false) AS retry,
            ${recentContractRequestTimes('profile')} AS profileTimes,
            ${recentContractRequestTimes('email')} AS emailTimes
        WHERE retry OR (${newLiveReferralReferenceWhere('reference')} AND
            CASE WHEN $direct THEN existing IS NULL OR ${contractRequestReplacementWhere('sender', 'false', 'referralConsentId')}
                ELSE existing.liveReferral = true AND existing.addressedByEmail = true
                    AND existing.requestId = $requestId AND existing.status = 'pending'
                    AND existing.referralConsentId = referralConsentId
                    AND datetime(existing.expiresAt) > lockedAt END)
        WITH contract, target, terms, sender, reference, retry, profileTimes, emailTimes,
            existing.requestId AS replacedId, existing.status AS replacedStatus,
            $direct AND NOT retry AND ${contractRequestCountForSender('profileTimes', 'sender')} >= $requestCap AS capped
        CALL {
            WITH contract, target, terms, sender, reference, retry, profileTimes, emailTimes, replacedId, replacedStatus, capped
            WITH contract, target, terms, sender, reference, retry, profileTimes, emailTimes, replacedId, replacedStatus
            WHERE NOT capped
            OPTIONAL MATCH (contract)-[previous:PREVIOUS_VISIBLE_REQUEST]->(target)
            MERGE (contract)-[request:REQUESTED_FOR]->(target)
            FOREACH (_ IN CASE WHEN NOT retry AND previous IS NOT NULL THEN [1] ELSE [] END |
                DELETE previous)
            FOREACH (_ IN CASE WHEN $direct AND NOT retry THEN [1] ELSE [] END |
                SET request += {requestId: $requestId, requestedBy: sender, externalReferenceId: reference,
                    message: $message, requestedAt: $now, addressedByEmail: null,
                    expiresAt: null, expiredAt: null,
                    profileRequestTimes: profileTimes + [$now + '|' + sender], emailRequestTimes: emailTimes})
            FOREACH (_ IN CASE WHEN NOT retry THEN [1] ELSE [] END |
                SET request.status = 'accepted', request.liveReferral = true, request.readStatus = 'seen',
                    request.referralConsentId = null)
            WITH contract, target, terms, request, retry,
                CASE WHEN $direct THEN replacedId END AS replacedId, replacedStatus
            ${detachReplacedRequestInviteCypher}
            WITH contract, target, terms, request, retry, request.requestId + ':attached' AS eventId
            MATCH (contract)-[:CREATED_BY]->(owner:Profile)
            FOREACH (_ IN CASE WHEN NOT retry THEN [1] ELSE [] END |
                SET terms.\`referral.requestId\` = request.requestId,
                    terms.\`referral.requestedBy\` = request.requestedBy,
                    terms.\`referral.externalReferenceId\` = request.externalReferenceId,
                    terms.updatedAt = $now
                CREATE (transaction:ConsentFlowTransaction {id: eventId, action: 'referral', date: $now})
                    -[:IS_FOR]->(terms)
                ${termsReferralSnapshotCypher()}
                CREATE (event:ConsentFlowEvent {id: eventId, contractId: contract.id, termsId: terms.id,
                    fromId: request.requestedBy, ownerId: owner.profileId, targetId: target.profileId,
                    domain: $domain, createdAt: $now, kind: 'referral_attached',
                    requestId: request.requestId, requestedBy: request.requestedBy,
                    externalReferenceId: request.externalReferenceId, integrationFanoutPending: true})
                FOREACH (_ IN CASE WHEN $direct THEN [1] ELSE [] END |
                    CREATE (event)-[:HAS_DELIVERY]->(:ConsentFlowEventDelivery {
                        id: eventId + ':' + target.profileId, toId: target.profileId, state: 'pending',
                        nextAttemptAt: $now, eventCreatedAt: $now, attempts: 0, role: 'target'})))
            RETURN request.requestId AS requestId, terms.id AS termsId, eventId
            UNION
            WITH capped
            WITH capped WHERE capped
            RETURN null AS requestId, null AS termsId, null AS eventId
        }
        RETURN requestId, termsId, eventId
    `);
    const record = (await runAudienceMutation(query)).records[0];
    if (!record) return null;
    if (!record.get('requestId')) return { status: 'capped' };

    await tryDispatchContractEvent(record.get('eventId'));
    return {
        status: 'accepted',
        requestId: record.get('requestId'),
        termsId: record.get('termsId'),
    };
};

/** Direct referrals can update existing terms without another consent or credential sync. */
export const attachReferralToLiveConsent = async (
    input: CreateRequestForProfileInput
): Promise<{ status: 'accepted'; requestId: string } | { status: 'capped' } | null> => {
    const result = await applyLiveReferral(input);
    return result?.status === 'accepted'
        ? { requestId: result.requestId, status: result.status }
        : result;
};

/** Accept only the email request the learner reviewed. It was counted when it attached. */
export const acceptContractRequestOnLiveConsent = async (
    input: AcceptLiveReferralInput
): Promise<string | null> => {
    const result = await applyLiveReferral(input);
    return result?.status === 'accepted' ? result.termsId : null;
};
