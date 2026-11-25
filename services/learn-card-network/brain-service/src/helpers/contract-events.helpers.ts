import { randomUUID } from 'node:crypto';
import { QueryBuilder } from 'neogma';
import { int } from 'neo4j-driver';
import { DbTermsValidator } from 'types/consentflowcontract';
import { neogma } from '@instance';
import { environment } from '@environment';
import {
    ConsentFlowTransactionValidator,
    ConsentFlowWebhookMetadataValidator,
    ConsentFlowContractNotificationDataValidator,
    LCNNotificationTypeEnumValidator,
    type ConsentFlowTransaction,
    type ConsentFlowWebhookMetadata,
    type LCNNotification,
} from '@learncard/types';
import { getContractById, getContractRequestAccess } from '@accesslayer/consentflowcontract/read';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { getContractTermsById } from '@accesslayer/consentflowcontract/relationships/read';
import {
    addNotificationToQueue,
    PermanentNotificationDeliveryError,
} from './notifications.helpers';
import { constructUri, getIdFromUri } from './uri.helpers';
import { getNotificationMessage, type NotificationMessageKey } from './notificationMessages';
import { sanitizeProfileForTier, stripSensitiveProfileListFields } from './profile-privacy.helpers';
import { getStoredContractRequest } from '@accesslayer/consentflowcontract/read';
import { resolveRecipientLocale } from './getRecipientLocale.helpers';
import { ensureContractEventMaintenance } from './contract-event-maintenance.helpers';
import { fanOutIntegrationEvents } from './integration-events.helpers';
import { updateDidForProfile } from './did.helpers';
import { buildContractUpdatePreview } from '@learncard/helpers';
import { storedContractRequestTimes } from './contract-request-cap.helpers';

type EventKind = ConsentFlowWebhookMetadata['event'] | 'contract_updated';
const defaultDomain = (): string => environment.DOMAIN_NAME ?? 'network.learncard.com';

const MAX_DELIVERY_ATTEMPTS = 12;
const DELIVERY_RETRY_WINDOW_MS = 24 * 60 * 60_000;
const INITIAL_RETRY_DELAY_MS = 60_000;
const MAX_RETRY_DELAY_MS = 60 * 60_000;
// At most 50 data recipients, the owner, and a requester outside the data audience.
const MAX_INLINE_EVENT_DELIVERIES = 50 + 1 + 1;
// Inline integration fan-out stops here or after one second; the worker continues.
const MAX_INLINE_INTEGRATION_FANOUT = 50;

export type ContractEventDispatchSummary = {
    delivered: number;
    pending: number;
    skipped: number;
    rejected: number;
    failed: number;
};

/** Persist a notification intent WITH the consent transaction, before any external work. */
export const appendConsentEvent = (
    query: QueryBuilder,
    {
        consenterProfileId,
        transaction,
        domain = defaultDomain(),
        messageKey,
        expectedRequestId,
    }: {
        consenterProfileId: string;
        transaction: ConsentFlowTransaction;
        domain?: string;
        messageKey: NotificationMessageKey;
        expectedRequestId?: string;
    }
): QueryBuilder => {
    const kind: EventKind =
        transaction.action === 'consent'
            ? 'consent_created'
            : transaction.action === 'update' || transaction.action === 'reconsent'
              ? 'consent_updated'
              : transaction.action === 'withdraw'
                ? 'consent_withdrawn'
                : 'credentials_synced';
    query.getBindParam().add({
        eventConsenter: consenterProfileId,
        eventDomain: domain,
        eventKind: kind,
        eventMessageKey: messageKey,
        eventPayload: JSON.stringify(transaction),
        eventRequestId: expectedRequestId ?? null,
    });
    // Independent consent restores the public request and leaves the unreviewed invite redacted.
    return query.raw(`
        WITH contract, terms, transaction
        MATCH (consenter:Profile {profileId: $eventConsenter})
        OPTIONAL MATCH (contract)-[request:REQUESTED_FOR]->(consenter)
        OPTIONAL MATCH (contract)-[previous:PREVIOUS_VISIBLE_REQUEST]->(consenter)
        OPTIONAL MATCH (contract)-[reviewed:PENDING_EMAIL_REQUEST]->(consenter)
            WHERE reviewed.requestId = $eventRequestId AND transaction.action IN ['consent', 'reconsent']
        WITH contract, terms, transaction, consenter, request, previous,
            coalesce(transaction.action IN ['consent', 'reconsent'] AND $eventRequestId IS NULL
                AND request.addressedByEmail = true AND request.status <> 'accepted', false) AS restoreVisible,
            reviewed
        OPTIONAL MATCH (contract)-[:HAS_REQUEST_INVITE]->(invite:ContractRequestInvite)
            WHERE restoreVisible AND invite.id = request.requestId
        FOREACH (_ IN CASE WHEN invite IS NOT NULL THEN [1] ELSE [] END |
            SET invite += {status: request.status, attachedProfileId: null, attachedAt: null})
        WITH contract, terms, transaction, consenter, request, previous, restoreVisible, reviewed,
            ${storedContractRequestTimes('profile', 'request')} AS profileTimes,
            ${storedContractRequestTimes('email', 'request')} AS emailTimes
        CALL {
            WITH contract, transaction, consenter, request, reviewed
            WITH contract, transaction, consenter AS target, request, reviewed
            WHERE reviewed IS NOT NULL AND request.requestId IS NOT NULL
                AND request.status = 'pending' AND NOT coalesce(request.addressedByEmail, false)
            MERGE (contract)-[closed:CANCELLED_DIRECT_REQUEST {requestId: request.requestId}]->(target)
            ON CREATE SET closed = request{.requestId, .requestedBy, .externalReferenceId,
                .message, .requestedAt, .readStatus, status: 'cancelled'}
            WITH contract, target, closed AS request, transaction
            ${requestEventWriteCypher({
                kind: "'request_cancelled'",
                actor: 'target.profileId',
                domain: '$eventDomain',
                now: 'transaction.date',
            })}
        }
        FOREACH (_ IN CASE WHEN restoreVisible THEN [1] ELSE [] END |
            SET request = coalesce(properties(previous), {requestHistoryOnly: true})
            SET request.profileRequestTimes = profileTimes, request.emailRequestTimes = emailTimes)
        FOREACH (_ IN CASE WHEN reviewed IS NOT NULL THEN [1] ELSE [] END |
            SET request = properties(reviewed)
            SET request.profileRequestTimes = profileTimes, request.emailRequestTimes = emailTimes
            DELETE reviewed)
        WITH contract, terms, transaction, consenter, request, previous, restoreVisible,
            request.status = 'pending' AND (request.expiresAt IS NULL OR request.expiresAt > transaction.date)
                AND (NOT coalesce(request.addressedByEmail, false) OR request.requestId = $eventRequestId) AS requestOpen
        SET terms.\`referral.requestId\` = CASE WHEN request.requestId IS NOT NULL AND (request.status = 'accepted' OR (requestOpen AND $eventKind IN ['consent_created', 'consent_updated']))
            THEN request.requestId ELSE terms.\`referral.requestId\` END,
            terms.\`referral.requestedBy\` = CASE WHEN request.requestId IS NOT NULL AND (request.status = 'accepted' OR (requestOpen AND $eventKind IN ['consent_created', 'consent_updated']))
            THEN request.requestedBy ELSE terms.\`referral.requestedBy\` END,
            terms.\`referral.externalReferenceId\` = CASE WHEN request.requestId IS NOT NULL AND (request.status = 'accepted' OR (requestOpen AND $eventKind IN ['consent_created', 'consent_updated']))
            THEN request.externalReferenceId ELSE terms.\`referral.externalReferenceId\` END,
            transaction.\`referral.requestId\` = terms.\`referral.requestId\`,
            transaction.\`referral.requestedBy\` = terms.\`referral.requestedBy\`,
            transaction.\`referral.externalReferenceId\` = terms.\`referral.externalReferenceId\`
        WITH contract, terms, transaction, consenter, request, previous, restoreVisible,
            request.requestId IS NOT NULL AND coalesce(requestOpen, false) AND $eventKind IN ['consent_created', 'consent_updated'] AS requestAccepted
        FOREACH (_ IN CASE WHEN $eventKind = 'consent_created' THEN [1] ELSE [] END |
            MERGE (contract)-[accepted:REQUESTED_FOR]->(consenter)
            ON CREATE SET accepted.status = 'accepted', accepted.readStatus = 'unseen'
            SET accepted.status = CASE WHEN accepted.requestId IS NULL THEN 'accepted' ELSE accepted.status END,
                accepted.readStatus = CASE WHEN accepted.requestHistoryOnly = true THEN 'unseen' ELSE accepted.readStatus END,
                accepted.requestHistoryOnly = null)
        FOREACH (_ IN CASE WHEN requestAccepted THEN [1] ELSE [] END |
            SET request.status = 'accepted')
        FOREACH (_ IN CASE WHEN (requestAccepted OR restoreVisible) AND previous IS NOT NULL THEN [1] ELSE [] END |
            DELETE previous)
        WITH contract, terms, transaction, consenter, requestAccepted
        CALL {
            WITH contract, transaction, consenter
            WITH contract, transaction, consenter WHERE transaction.action IN ['consent', 'reconsent']
            MATCH (contract)-[parked:PENDING_EMAIL_REQUEST]->(consenter)
            MATCH (contract)-[:HAS_REQUEST_INVITE]->(remaining:ContractRequestInvite {id: parked.requestId})
            SET remaining += {status: parked.status, attachedProfileId: null, attachedAt: null}
            DELETE parked
        }
        WITH contract, terms, transaction, requestAccepted
        MATCH (contract)-[:CREATED_BY]->(owner:Profile)
        OPTIONAL MATCH (contract)-[:SHARES_DATA_WITH]->(recipient:Profile)
        WITH contract, terms, transaction, owner, requestAccepted, collect(DISTINCT recipient.profileId) AS recipientIds
        CREATE (event:ConsentFlowEvent {id: transaction.id, contractId: contract.id, termsId: terms.id,
            fromId: $eventConsenter, ownerId: owner.profileId, domain: $eventDomain,
            kind: $eventKind, requestAccepted: requestAccepted, messageKey: $eventMessageKey, payload: $eventPayload, cleanupPending: true,
            integrationFanoutPending: true,
            createdAt: transaction.date, requestId: terms.\`referral.requestId\`,
            requestedBy: terms.\`referral.requestedBy\`, externalReferenceId: terms.\`referral.externalReferenceId\`})
        WITH contract, terms, transaction, event, owner,
            [owner.profileId] + [id IN recipientIds WHERE id <> owner.profileId] AS audience
        WITH contract, terms, transaction, event, owner, audience,
            audience + CASE WHEN event.requestAccepted AND event.requestedBy IS NOT NULL AND NOT event.requestedBy IN audience
                THEN [event.requestedBy] ELSE [] END AS deliveries
        FOREACH (recipientId IN [id IN deliveries WHERE id <> $eventConsenter] |
        CREATE (event)-[:HAS_DELIVERY]->(delivery:ConsentFlowEventDelivery {
            id: event.id + ':' + recipientId, toId: recipientId, state: 'pending', nextAttemptAt: event.createdAt,
            eventCreatedAt: event.createdAt, attempts: 0,
            role: CASE WHEN recipientId = owner.profileId THEN 'owner'
                WHEN recipientId IN audience THEN 'recipient' ELSE 'requester' END}))
        WITH DISTINCT contract, terms, transaction
    `);
};

/**
 * Shared Cypher for request creation/decisions; caller holds the contract lock.
 * For a request addressed to an email, integration records carry no subject, and the
 * request_sent written when the invite attaches is not fanned out: integrations already got one,
 * without a subject, when the invite was created.
 */
const requestEventWriteCypher = ({
    kind = '$eventKind',
    actor = '$eventFrom',
    domain = '$domain',
    now = '$now',
}: { kind?: string; actor?: string; domain?: string; now?: string } = {}): string => `
    WITH contract, request, target, ${kind} AS kind, ${actor} AS actor,
        ${domain} AS domain, ${now} AS now
    MATCH (contract)-[:CREATED_BY]->(owner:Profile)
    MERGE (event:ConsentFlowEvent {id: CASE WHEN kind = 'request_sent' THEN request.requestId ELSE request.requestId + ':' + request.status END})
    ON CREATE SET event += {contractId: contract.id, fromId: actor,
        ownerId: owner.profileId, domain: domain, kind: kind, createdAt: now,
        requestId: request.requestId, requestedBy: request.requestedBy,
        externalReferenceId: request.externalReferenceId, message: request.message, fanoutCreated: false, cleanupPending: true,
        targetId: target.profileId,
        integrationFanoutPending: CASE WHEN kind = 'request_sent' AND coalesce(request.addressedByEmail, false) THEN null ELSE true END,
        subjectHidden: CASE WHEN coalesce(request.addressedByEmail, false) THEN true ELSE null END,
        hideActor: coalesce(request.addressedByEmail, false) AND actor = target.profileId}
    WITH request, event, owner, kind, actor, now,
        CASE WHEN coalesce(event.fanoutCreated, false) THEN []
            WHEN kind = 'request_cancelled' AND coalesce(request.addressedByEmail, false)
                AND actor <> target.profileId THEN []
            WHEN kind = 'request_sent' THEN [target.profileId]
            ELSE [owner.profileId] + CASE WHEN request.requestedBy <> owner.profileId
                THEN [request.requestedBy] ELSE [] END END AS deliveries
    FOREACH (recipientId IN [id IN deliveries WHERE id IS NOT NULL AND id <> actor] |
    MERGE (event)-[:HAS_DELIVERY]->(delivery:ConsentFlowEventDelivery {id: event.id + ':' + recipientId})
    ON CREATE SET delivery += {toId: recipientId, state: 'pending', nextAttemptAt: now,
        eventCreatedAt: event.createdAt, attempts: 0,
        role: CASE WHEN kind = 'request_sent' THEN 'target'
            WHEN recipientId = owner.profileId THEN 'owner' ELSE 'requester' END})
    SET event.fanoutCreated = true
`;

export const requestEventCypher = `
    ${requestEventWriteCypher()}
    RETURN DISTINCT request, event.id AS eventId
`;

type StoredEvent = {
    id: string;
    contractId: string;
    termsId?: string;
    fromId: string;
    ownerId: string;
    domain: string;
    kind: EventKind;
    createdAt: string;
    payload?: string;
    messageKey?: NotificationMessageKey;
    requestId?: string;
    requestedBy?: string;
    externalReferenceId?: string;
    message?: string;
    requestAccepted?: boolean;
    /** True when the target of an email-addressed request made this decision. */
    hideActor?: boolean;
};
type StoredDelivery = {
    id: string;
    toId: string;
    role: ConsentFlowWebhookMetadata['recipientRole'];
};

const expiryActive = (expiry?: string): boolean =>
    !expiry?.trim() || Date.parse(expiry) > Date.now();

/** Suppress queued audience data after recipient removal, withdrawal or expiry. */
export const authorizeContractNotification = async (
    notification: LCNNotification
): Promise<boolean> => {
    const parsed = ConsentFlowWebhookMetadataValidator.safeParse(notification.data?.metadata);
    if (!parsed.success) return true; // Existing unrelated notifications retain their behavior.
    const metadata = parsed.data;
    if (metadata.event === 'request_sent') {
        const request = await getStoredContractRequest(
            getIdFromUri(metadata.contractUri),
            notification.to.profileId ?? '',
            { requestId: metadata.requestId }
        );
        return request?.requestId === metadata.requestId && request?.status === 'pending';
    }
    const toProfileId = notification.to.profileId;
    if (!toProfileId) return false;
    const access = await getContractRequestAccess(getIdFromUri(metadata.contractUri), toProfileId);
    const isRequester = toProfileId === metadata.requestedBy;
    if (metadata.event.startsWith('request_')) {
        // Apply the narrowed audience to old pending deliveries and already queued messages too.
        return access.isOwner || isRequester;
    }
    if (!access.isManager && !isRequester) {
        // Consented data is shared with this recipient, but another referrer's CRM ID is not.
        if (notification.data?.metadata) {
            delete notification.data.metadata.externalReferenceId;
            delete notification.data.metadata.message;
        }
        if (notification.data?.transaction?.referral)
            delete notification.data.transaction.referral.externalReferenceId;
    }
    if (metadata.recipientRole !== 'owner' && metadata.recipientRole !== 'recipient') return false;
    if (!access.isRecipient) return false;
    if (metadata.event === 'consent_withdrawn') return true;
    if (!metadata.termsUri) return false;
    const relationship = await getContractTermsById(getIdFromUri(metadata.termsUri));
    const parsedTerms = DbTermsValidator.safeParse(relationship?.terms);
    if (!relationship || !parsedTerms.success) return false;
    const terms = parsedTerms.data;
    if (
        !(terms.status === 'live' || (terms.status === 'consumed' && terms.oneTime)) ||
        !expiryActive(terms.expiresAt) ||
        !expiryActive(relationship.contract.expiresAt)
    )
        return false;
    const personal = notification.data?.transaction?.terms?.read.personal;
    if (personal)
        for (const [key, value] of Object.entries(personal))
            if (terms.terms.read.personal[key] !== value) delete personal[key];
    // Legacy sync payload shape is preserved, but only still-authorized URIs are delivered.
    const shared = notification.data?.transaction?.terms?.read.credentials.categories;
    if (shared)
        for (const [category, grant] of Object.entries(shared)) {
            const current = terms.terms.read.credentials.categories[category];
            grant.shared =
                terms.terms.read.credentials.sharing !== false &&
                current?.sharing &&
                expiryActive(current.shareUntil)
                    ? (grant.shared ?? []).filter(uri => current.shared?.includes(uri))
                    : [];
        }
    return true;
};

const buildNotification = async (
    event: StoredEvent,
    delivery: StoredDelivery
): Promise<LCNNotification | null> => {
    const [from, to, owner, contract] = await Promise.all([
        getProfileByProfileId(event.fromId),
        getProfileByProfileId(delivery.toId),
        getProfileByProfileId(event.ownerId),
        getContractById(event.contractId),
    ]);
    if (!from || !to || !owner) return null;
    if (event.kind === 'contract_updated') {
        if (!contract) return null;
        const data = ConsentFlowContractNotificationDataValidator.parse(
            JSON.parse(event.payload ?? '')
        );
        const preview =
            data.preview ??
            buildContractUpdatePreview({
                name: contract.name,
                kind: data.kind,
                diff: data.diff,
            });
        const sender = updateDidForProfile(event.domain, from);
        return {
            type: LCNNotificationTypeEnumValidator.enum.CONSENT_FLOW_CONTRACT_UPDATED,
            from: {
                ...stripSensitiveProfileListFields(
                    sanitizeProfileForTier(sender, 'unauthenticated')
                ),
                did: sender.did,
            },
            to: updateDidForProfile(event.domain, to),
            sent: event.createdAt,
            ...(data.kind === 'requires_consent'
                ? { message: { title: preview.headline, body: data.reason ?? preview.subhead } }
                : {}),
            data,
        };
    }
    const eventKind =
        delivery.role === 'requester' && event.requestAccepted ? 'request_accepted' : event.kind;
    const metadata = ConsentFlowWebhookMetadataValidator.parse({
        eventId: event.id,
        deliveryKey: delivery.id,
        event: eventKind,
        contractUri: constructUri('contract', event.contractId, event.domain),
        ...(event.termsId && delivery.role !== 'requester' && delivery.role !== 'target'
            ? { termsUri: constructUri('terms', event.termsId, event.domain) }
            : {}),
        requestId: event.requestId,
        requestedBy: event.requestedBy,
        externalReferenceId: event.externalReferenceId,
        recipientRole: delivery.role,
    });
    const requesterDecision = delivery.role === 'requester';
    const legacyAi = event.messageKey === 'consentFlowInsightsShared';
    // The target of an email-addressed request stays private until it accepts.
    const hideActor = event.hideActor === true;
    const sender = hideActor ? owner : from;
    const transaction =
        event.payload && delivery.role !== 'requester' && delivery.role !== 'target'
            ? ConsentFlowTransactionValidator.parse({
                  ...JSON.parse(event.payload),
                  ...(event.requestId
                      ? {
                            referral: {
                                requestId: event.requestId,
                                requestedBy: event.requestedBy,
                                externalReferenceId: event.externalReferenceId,
                            },
                        }
                      : {}),
              })
            : undefined;
    const notification: LCNNotification = {
        type: LCNNotificationTypeEnumValidator.enum.CONSENT_FLOW_TRANSACTION,
        from: {
            ...stripSensitiveProfileListFields(sanitizeProfileForTier(sender, 'unauthenticated')),
            did: sender.did,
        },
        to,
        sent: event.createdAt,
        message: getNotificationMessage(
            (requesterDecision ? undefined : event.messageKey) ??
                (event.kind === 'request_sent'
                    ? 'contractRequestReceived'
                    : eventKind === 'request_accepted'
                      ? 'contractRequestAccepted'
                      : eventKind === 'request_denied'
                        ? hideActor
                            ? 'contractRequestDeniedByInvitee'
                            : 'contractRequestDenied'
                        : hideActor
                          ? 'contractRequestCancelledByInvitee'
                          : 'contractRequestCancelled'),
            resolveRecipientLocale(to),
            {
                name: sender.displayName,
                referrer: sender.displayName || sender.profileId,
                contractOwner: owner.displayName || owner.profileId,
                consenter: sender.displayName,
                contractName: contract?.name ?? '',
                totalCredentials: String(
                    transaction?.terms
                        ? Object.values(transaction.terms.read.credentials.categories).reduce(
                              (n, category) => n + (category.shared?.length ?? 0),
                              0
                          )
                        : 0
                ),
                categoryCount: String(
                    Object.keys(transaction?.terms?.read.credentials.categories ?? {}).length
                ),
            }
        ),
        data: {
            ...(transaction ? { transaction } : {}),
            metadata: {
                ...metadata,
                ...(legacyAi ? { type: 'AI Insight', contractId: event.contractId } : {}),
                ...(event.kind === 'request_sent'
                    ? {
                          type: 'contract-request',
                          ...(event.message ? { message: event.message } : {}),
                      }
                    : {}),
            },
        },
    };
    return (await authorizeContractNotification(notification)) ? notification : null;
};

/** At-least-once dispatch. Leases fence overlapping workers; deliveryKey fences consumer retries. */
export const dispatchContractEvents = async ({
    eventId,
    limit = 25,
    budgetMs = 20_000,
}: {
    eventId?: string;
    limit?: number;
    budgetMs?: number;
} = {}): Promise<ContractEventDispatchSummary> => {
    const deadline = Date.now() + budgetMs;
    const summary = { delivered: 0, pending: 0, skipped: 0, rejected: 0, failed: 0 };
    const retryCutoff = new Date(Date.now() - DELIVERY_RETRY_WINDOW_MS).toISOString();
    const batchLimit = int(Math.max(1, Math.min(100, Math.trunc(limit))));
    if (!eventId) await ensureContractEventMaintenance();
    // Also recover cleanup after a crash and clear events with no eligible recipients.
    await neogma.queryRunner.run(
        `
        ${
            eventId
                ? 'MATCH (event:ConsentFlowEvent {id: $eventId})'
                : `MATCH (event:ConsentFlowEvent)
        USING INDEX event:ConsentFlowEvent(cleanupPending)`
        }
        WHERE ${eventId ? '(event.payload IS NOT NULL OR event.message IS NOT NULL OR event.cleanupPending = true)' : 'event.cleanupPending = true'}
            AND NOT EXISTS {
                MATCH (event)-[:HAS_DELIVERY]->(delivery:ConsentFlowEventDelivery)
                WHERE delivery.state = 'pending'
            }
        WITH event LIMIT $limit
        SET event.deliveryLock = coalesce(event.deliveryLock, 0) + 1
        WITH event WHERE NOT EXISTS {
            MATCH (event)-[:HAS_DELIVERY]->(delivery:ConsentFlowEventDelivery)
            WHERE delivery.state = 'pending'
        }
        SET event.payload = null, event.message = null, event.cleanupPending = null
        `,
        { eventId: eventId ?? null, limit: batchLimit }
    );
    const rows = await neogma.queryRunner.run(
        `
        ${
            eventId
                ? `MATCH (event:ConsentFlowEvent {id: $eventId})-[:HAS_DELIVERY]->(delivery:ConsentFlowEventDelivery)
        WHERE delivery.state = 'pending'
            AND (delivery.nextAttemptAt <= $now OR event.createdAt <= $retryCutoff
                OR coalesce(delivery.attempts, 0) >= $maxAttempts)`
                : `CALL {
            MATCH (delivery:ConsentFlowEventDelivery)
            USING INDEX delivery:ConsentFlowEventDelivery(state, nextAttemptAt)
            WHERE delivery.state = 'pending' AND delivery.nextAttemptAt <= $now
            MATCH (event:ConsentFlowEvent)-[:HAS_DELIVERY]->(delivery)
            RETURN event, delivery
            UNION
            MATCH (delivery:ConsentFlowEventDelivery)
            USING INDEX delivery:ConsentFlowEventDelivery(state, eventCreatedAt)
            WHERE delivery.state = 'pending' AND delivery.eventCreatedAt <= $retryCutoff
            MATCH (event:ConsentFlowEvent)-[:HAS_DELIVERY]->(delivery)
            RETURN event, delivery
            UNION
            MATCH (delivery:ConsentFlowEventDelivery)
            USING INDEX delivery:ConsentFlowEventDelivery(state, attempts)
            WHERE delivery.state = 'pending' AND delivery.attempts >= $maxAttempts
            MATCH (event:ConsentFlowEvent)-[:HAS_DELIVERY]->(delivery)
            RETURN event, delivery
        }
        WITH event, delivery WHERE true`
        }
        AND (delivery.leaseUntil IS NULL OR delivery.leaseUntil < $now)
        RETURN event, delivery ORDER BY delivery.nextAttemptAt, delivery.id LIMIT $limit
    `,
        {
            now: new Date().toISOString(),
            eventId: eventId ?? null,
            retryCutoff,
            maxAttempts: int(MAX_DELIVERY_ATTEMPTS),
            limit: batchLimit,
        }
    );
    for (const row of rows.records) {
        if (Date.now() >= deadline) break;
        const event: StoredEvent = row.get('event').properties;
        const delivery: StoredDelivery = row.get('delivery').properties;
        const lease = randomUUID();
        const now = new Date().toISOString();
        const claimed = await neogma.queryRunner.run(
            `
            MATCH (event:ConsentFlowEvent)-[:HAS_DELIVERY]->(delivery:ConsentFlowEventDelivery {id: $id})
            SET delivery.lock = coalesce(delivery.lock, 0) + 1
            WITH event, delivery WHERE delivery.state = 'pending'
                AND (delivery.nextAttemptAt <= $now OR event.createdAt <= $retryCutoff
                    OR coalesce(delivery.attempts, 0) >= $maxAttempts)
                AND (delivery.leaseUntil IS NULL OR delivery.leaseUntil < $now)
            WITH delivery, coalesce(delivery.attempts, 0) AS previousAttempts
            SET delivery.lease = $lease, delivery.leaseUntil = $leaseUntil,
                delivery.attempts = CASE WHEN previousAttempts < $maxAttempts
                    THEN previousAttempts + 1 ELSE previousAttempts END
            RETURN previousAttempts
        `,
            {
                id: delivery.id,
                now,
                lease,
                leaseUntil: new Date(Date.now() + 60_000).toISOString(),
                retryCutoff,
                maxAttempts: int(MAX_DELIVERY_ATTEMPTS),
            }
        );
        if (!claimed.records.length) continue;
        // Count claims, including abandoned leases, so crashes cannot reset the retry budget.
        const previousAttempts = Number(claimed.records[0]!.get('previousAttempts'));
        const attempts = Math.min(previousAttempts + 1, MAX_DELIVERY_ATTEMPTS);
        let state = 'pending';
        let failureReason: string | null = null;
        try {
            if (event.createdAt <= retryCutoff || previousAttempts >= MAX_DELIVERY_ATTEMPTS) {
                state = 'failed';
                failureReason =
                    event.createdAt <= retryCutoff ? 'retry_expired' : 'retry_exhausted';
                summary.failed++;
            } else {
                const notification = await buildNotification(event, delivery);
                if (!notification) {
                    state = 'skipped';
                    summary.skipped++;
                } else {
                    const delivered = await addNotificationToQueue(notification, {
                        propagateDirectWebhookTransportErrors: true,
                        throwOnPermanentFailure: true,
                    });
                    if (delivered === false)
                        throw new Error('Contract notification was not stored');
                    state = 'delivered';
                    summary.delivered++;
                }
            }
        } catch (error) {
            if (error instanceof PermanentNotificationDeliveryError) {
                state = 'rejected';
                failureReason = error.reason;
                summary.rejected++;
            } else if (attempts >= MAX_DELIVERY_ATTEMPTS) {
                state = 'failed';
                failureReason = 'retry_exhausted';
                summary.failed++;
            } else {
                summary.pending++;
            }
            // Never log request references, profile identifiers, or consent payloads.
            console.warn(`contract_events: delivery_${state}`);
        }
        // Serialize fan-out completion so concurrent last deliveries cannot both miss cleanup.
        // History lives on Terms/Transactions; finished intents retain IDs and coarse outcomes.
        await neogma.queryRunner.run(
            `
            MATCH (event:ConsentFlowEvent)-[:HAS_DELIVERY]->(delivery:ConsentFlowEventDelivery {id: $id})
            SET delivery.lock = coalesce(delivery.lock, 0) + 1
            WITH event, delivery WHERE delivery.lease = $lease
            SET event.deliveryLock = coalesce(event.deliveryLock, 0) + 1
            WITH event, delivery WHERE delivery.lease = $lease
            SET delivery.state = $state, delivery.lease = null, delivery.leaseUntil = null,
                delivery.updatedAt = $now, delivery.failureReason = $failureReason,
                delivery.nextAttemptAt = $nextAttemptAt
            WITH event
            WHERE NOT EXISTS {
                MATCH (event)-[:HAS_DELIVERY]->(remaining:ConsentFlowEventDelivery)
                WHERE remaining.state = 'pending'
            }
            SET event.payload = null, event.message = null, event.cleanupPending = null
        `,
            {
                id: delivery.id,
                lease,
                state,
                failureReason,
                now: new Date().toISOString(),
                nextAttemptAt:
                    state === 'pending'
                        ? new Date(
                              Math.min(
                                  Date.now() +
                                      Math.min(
                                          INITIAL_RETRY_DELAY_MS * 2 ** (attempts - 1),
                                          MAX_RETRY_DELAY_MS
                                      ),
                                  Date.parse(event.createdAt) + DELIVERY_RETRY_WINDOW_MS
                              )
                          ).toISOString()
                        : null,
            }
        );
    }
    return summary;
};

/** A committed API mutation must succeed even if dispatch is temporarily unavailable. */
export const tryDispatchContractEvent = async (eventId: string): Promise<void> => {
    try {
        await dispatchContractEvents({
            eventId,
            limit: MAX_INLINE_EVENT_DELIVERIES,
            budgetMs: 1_000,
        });
    } catch {
        console.warn('contract_events: dispatch_pending');
    }
    // Integrations are told in the same request when possible; the worker retries otherwise.
    // Older events of the same contract that are still waiting go first, to keep feed order.
    try {
        await fanOutIntegrationEvents({
            eventId,
            limit: MAX_INLINE_INTEGRATION_FANOUT,
            budgetMs: 1_000,
        });
    } catch {
        console.warn('integration_events: fanout_pending');
    }
};

/**
 * Inline fan-out of a contract's integration-only events (retirement, re-consent pause) right
 * after the mutation that wrote them committed. Bounded; the worker finishes what is left.
 */
export const tryFanOutContractIntegrationEvents = async (contractId: string): Promise<void> => {
    try {
        await fanOutIntegrationEvents({
            contractId,
            limit: MAX_INLINE_INTEGRATION_FANOUT,
            budgetMs: 1_000,
        });
    } catch {
        console.warn('integration_events: fanout_pending');
    }
};
