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
import { parkEmailRequestCypher } from './contract-request-visibility.helpers';
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
        OPTIONAL MATCH (contract)-[previous:PREVIOUS_VISIBLE_REQUEST]->(target)
        OPTIONAL MATCH (contract)-[parked:PENDING_EMAIL_REQUEST]->(target)
            WHERE NOT $direct AND parked.requestId = $requestId
        WITH contract, target, terms, existing, lockedAt, parked,
            coalesce(parked, existing) AS candidate,
            CASE WHEN $direct AND existing.addressedByEmail = true AND existing.status <> 'accepted'
                THEN previous ELSE coalesce(parked, existing) END AS retryRequest
        WITH contract, target, terms, existing, lockedAt, parked, candidate, retryRequest,
            CASE WHEN $direct THEN $senderProfileId ELSE candidate.requestedBy END AS sender,
            CASE WHEN $direct THEN $externalReferenceId ELSE candidate.externalReferenceId END AS reference
        WHERE sender <> $targetProfileId AND ${liveReferralSenderWhere('sender', 'parked IS NOT NULL')}
            AND EXISTS {
                MATCH (contract)-[:CREATED_BY|CAN_WRITE|SHARES_DATA_WITH]->(:Profile {profileId: sender})
            }
        WITH contract, target, terms, existing, sender, reference, lockedAt, retryRequest, parked, candidate,
            coalesce(terms.lastConsentTransactionId, terms.id) AS referralConsentId,
            coalesce(retryRequest.liveReferral = true AND retryRequest.status = 'accepted'
                AND retryRequest.requestId = terms.\`referral.requestId\`
                AND CASE WHEN $direct THEN NOT coalesce(retryRequest.addressedByEmail, false)
                    AND retryRequest.requestedBy = sender AND retryRequest.externalReferenceId = reference
                    AND coalesce(retryRequest.message, '') = coalesce($message, '')
                    ELSE retryRequest.addressedByEmail = true AND retryRequest.requestId = $requestId END, false) AS retry,
            ${recentContractRequestTimes('profile')} AS profileTimes,
            ${recentContractRequestTimes('email')} AS emailTimes
        WHERE retry OR ((${newLiveReferralReferenceWhere('reference')} OR
            (parked IS NOT NULL AND reference IS NOT NULL AND terms.\`referral.requestedBy\` <> sender)) AND
            CASE WHEN $direct THEN existing IS NULL OR ${contractRequestReplacementWhere('sender', 'false', 'referralConsentId')}
                ELSE candidate.liveReferral = true AND candidate.addressedByEmail = true
                    AND candidate.requestId = $requestId AND candidate.status = 'pending'
                    AND candidate.referralConsentId = referralConsentId
                    AND datetime(candidate.expiresAt) > lockedAt END)
        WITH contract, target, terms, sender, reference, retry, profileTimes, emailTimes, parked,
            retryRequest.requestId AS retryId,
            existing.requestId AS replacedId, existing.status AS replacedStatus,
            coalesce($direct AND existing.addressedByEmail = true AND existing.status = 'pending'
                AND existing.requestedBy <> sender, false) AS park,
            $direct AND NOT retry AND ${contractRequestCountForSender('profileTimes', 'sender')} >= $requestCap AS capped
        CALL {
            WITH contract, target, terms, sender, reference, retry, retryId, profileTimes, emailTimes, replacedId, replacedStatus, park, parked, capped
            WITH contract, target, terms, sender, reference, retry, retryId, profileTimes, emailTimes, replacedId, replacedStatus, park, parked,
                parked IS NOT NULL AND NOT retry AS promote
            WHERE NOT capped
            OPTIONAL MATCH (contract)-[previous:PREVIOUS_VISIBLE_REQUEST]->(target)
            MERGE (contract)-[request:REQUESTED_FOR]->(target)
            ${parkEmailRequestCypher('request', 'target', 'park AND NOT retry')}
            FOREACH (_ IN CASE WHEN promote THEN [1] ELSE [] END |
                SET request = properties(parked)
                SET request.profileRequestTimes = profileTimes, request.emailRequestTimes = emailTimes
                DELETE parked)
            FOREACH (_ IN CASE WHEN NOT retry AND previous IS NOT NULL THEN [1] ELSE [] END |
                DELETE previous)
            FOREACH (_ IN CASE WHEN $direct AND NOT retry THEN [1] ELSE [] END |
                SET request += {requestId: $requestId, requestedBy: sender, externalReferenceId: reference,
                    message: $message, requestedAt: $now, addressedByEmail: null,
                    expiresAt: null, expiredAt: null, requestHistoryOnly: null,
                    profileRequestTimes: profileTimes + [$now + '|' + sender], emailRequestTimes: emailTimes})
            FOREACH (_ IN CASE WHEN NOT retry THEN [1] ELSE [] END |
                SET request.status = 'accepted', request.liveReferral = true, request.readStatus = 'seen',
                    request.referralConsentId = null)
            WITH contract, target, terms, request, retry, retryId,
                CASE WHEN ($direct AND NOT park) OR promote THEN replacedId END AS replacedId, replacedStatus
            ${detachReplacedRequestInviteCypher}
            WITH contract, target, terms, request, retry,
                CASE WHEN retry THEN retryId ELSE request.requestId END AS requestId
            WITH contract, target, terms, request, retry, requestId, requestId + ':attached' AS eventId
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
            RETURN requestId, terms.id AS termsId, eventId
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
