import { randomUUID } from 'node:crypto';
import { QueryBuilder } from 'neogma';
import { int } from 'neo4j-driver';
import { DbTermsValidator } from 'types/consentflowcontract';
import { neogma } from '@instance';
import { environment } from '@environment';
import {
    ConsentFlowTransactionValidator,
    ConsentFlowWebhookMetadataValidator,
    LCNNotificationTypeEnumValidator,
    type ConsentFlowTransaction,
    type ConsentFlowWebhookMetadata,
    type LCNNotification,
} from '@learncard/types';
import { getContractById } from '@accesslayer/consentflowcontract/read';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { getContractTermsById } from '@accesslayer/consentflowcontract/relationships/read';
import { canReadContractData } from '@accesslayer/consentflowcontract/relationships/recipients';
import { addNotificationToQueue } from './notifications.helpers';
import { constructUri, getIdFromUri } from './uri.helpers';
import { getNotificationMessage, type NotificationMessageKey } from './notificationMessages';
import { sanitizeProfileForTier, stripSensitiveProfileListFields } from './profile-privacy.helpers';
import { getStoredContractRequest } from '@accesslayer/consentflowcontract/read';
import { resolveRecipientLocale } from './getRecipientLocale.helpers';

type EventKind = ConsentFlowWebhookMetadata['event'];
const defaultDomain = (): string => environment.DOMAIN_NAME ?? 'network.learncard.com';

/** Persist a notification intent WITH the consent transaction, before any external work. */
export const appendConsentEvent = (
    query: QueryBuilder,
    {
        consenterProfileId,
        transaction,
        domain = defaultDomain(),
        messageKey,
    }: {
        consenterProfileId: string;
        transaction: ConsentFlowTransaction;
        domain?: string;
        messageKey: NotificationMessageKey;
    }
): QueryBuilder => {
    const kind: EventKind =
        transaction.action === 'consent'
            ? 'consent_created'
            : transaction.action === 'update'
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
    });
    return query.raw(`
        WITH contract, terms, transaction
        MATCH (consenter:Profile {profileId: $eventConsenter})
        OPTIONAL MATCH (contract)-[request:REQUESTED_FOR]->(consenter)
        SET terms.\`referral.requestId\` = CASE WHEN request.requestId IS NOT NULL AND (request.status = 'accepted' OR (request.status = 'pending' AND $eventKind IN ['consent_created', 'consent_updated']))
            THEN request.requestId ELSE terms.\`referral.requestId\` END,
            terms.\`referral.requestedBy\` = CASE WHEN request.requestId IS NOT NULL AND (request.status = 'accepted' OR (request.status = 'pending' AND $eventKind IN ['consent_created', 'consent_updated']))
            THEN request.requestedBy ELSE terms.\`referral.requestedBy\` END,
            terms.\`referral.externalReferenceId\` = CASE WHEN request.requestId IS NOT NULL AND (request.status = 'accepted' OR (request.status = 'pending' AND $eventKind IN ['consent_created', 'consent_updated']))
            THEN request.externalReferenceId ELSE terms.\`referral.externalReferenceId\` END,
            transaction.\`referral.requestId\` = terms.\`referral.requestId\`,
            transaction.\`referral.requestedBy\` = terms.\`referral.requestedBy\`,
            transaction.\`referral.externalReferenceId\` = terms.\`referral.externalReferenceId\`
        WITH contract, terms, transaction, consenter, request,
            request.requestId IS NOT NULL AND request.status = 'pending' AND $eventKind IN ['consent_created', 'consent_updated'] AS requestAccepted
        FOREACH (_ IN CASE WHEN $eventKind = 'consent_created' THEN [1] ELSE [] END |
            MERGE (contract)-[accepted:REQUESTED_FOR]->(consenter)
            ON CREATE SET accepted.status = 'accepted', accepted.readStatus = 'unseen'
            SET accepted.status = CASE WHEN accepted.requestId IS NULL OR accepted.status = 'pending'
                THEN 'accepted' ELSE accepted.status END)
        FOREACH (_ IN CASE WHEN requestAccepted THEN [1] ELSE [] END |
            SET request.status = 'accepted')
        WITH contract, terms, transaction, requestAccepted
        MATCH (contract)-[:CREATED_BY]->(owner:Profile)
        OPTIONAL MATCH (contract)-[:SHARES_DATA_WITH]->(recipient:Profile)
        WITH contract, terms, transaction, owner, requestAccepted, collect(DISTINCT recipient.profileId) AS recipientIds
        CREATE (event:ConsentFlowEvent {id: transaction.id, contractId: contract.id, termsId: terms.id,
            fromId: $eventConsenter, ownerId: owner.profileId, domain: $eventDomain,
            kind: $eventKind, requestAccepted: requestAccepted, messageKey: $eventMessageKey, payload: $eventPayload,
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
            role: CASE WHEN recipientId = owner.profileId THEN 'owner'
                WHEN recipientId IN audience THEN 'recipient' ELSE 'requester' END}))
        WITH DISTINCT contract, terms, transaction
    `);
};

/** Shared Cypher for request creation/decisions; caller holds the contract lock. */
export const requestEventCypher = `
    WITH contract, request, target
    MATCH (contract)-[:CREATED_BY]->(owner:Profile)
    OPTIONAL MATCH (contract)-[:SHARES_DATA_WITH]->(recipient:Profile)
    WITH contract, request, target, owner, collect(DISTINCT recipient.profileId) AS recipientIds
    MERGE (event:ConsentFlowEvent {id: CASE WHEN $eventKind = 'request_sent' THEN request.requestId ELSE request.requestId + ':' + request.status END})
    ON CREATE SET event += {contractId: contract.id, fromId: $eventFrom,
        ownerId: owner.profileId, domain: $domain, kind: $eventKind, createdAt: $now,
        requestId: request.requestId, requestedBy: request.requestedBy,
        externalReferenceId: request.externalReferenceId, message: request.message, fanoutCreated: false}
    WITH request, event, owner,
        [owner.profileId] + [id IN recipientIds WHERE id <> owner.profileId] AS audience, target
    WITH request, event, owner, audience,
        CASE WHEN coalesce(event.fanoutCreated, false) THEN []
            WHEN $eventKind = 'request_sent' THEN [target.profileId]
            ELSE audience + CASE WHEN NOT request.requestedBy IN audience THEN [request.requestedBy] ELSE [] END END AS deliveries
    FOREACH (recipientId IN [id IN deliveries WHERE id IS NOT NULL AND id <> $eventFrom] |
    MERGE (event)-[:HAS_DELIVERY]->(delivery:ConsentFlowEventDelivery {id: event.id + ':' + recipientId})
    ON CREATE SET delivery += {toId: recipientId, state: 'pending', nextAttemptAt: $now,
        role: CASE WHEN $eventKind = 'request_sent' THEN 'target'
            WHEN recipientId = owner.profileId THEN 'owner'
            WHEN recipientId IN audience THEN 'recipient' ELSE 'requester' END})
    SET event.fanoutCreated = true
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
            notification.to.profileId ?? ''
        );
        return request?.requestId === metadata.requestId && request?.status === 'pending';
    }
    if (metadata.recipientRole !== 'owner' && metadata.recipientRole !== 'recipient') return true;
    if (
        !notification.to.profileId ||
        !(await canReadContractData(getIdFromUri(metadata.contractUri), notification.to.profileId))
    )
        return false;
    if (metadata.event === 'consent_withdrawn' || metadata.event.startsWith('request_'))
        return true;
    if (!metadata.termsUri) return false;
    const relationship = await getContractTermsById(getIdFromUri(metadata.termsUri));
    const parsedTerms = DbTermsValidator.safeParse(relationship?.terms);
    if (!relationship || !parsedTerms.success) return false;
    const terms = parsedTerms.data;
    if (
        !(terms.status === 'live' || (terms.status === 'stale' && terms.oneTime)) ||
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
            ...stripSensitiveProfileListFields(sanitizeProfileForTier(from, 'unauthenticated')),
            did: from.did,
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
                        ? 'contractRequestDenied'
                        : 'contractRequestCancelled'),
            resolveRecipientLocale(to),
            {
                name: from.displayName,
                referrer: from.displayName || from.profileId,
                contractOwner: owner.displayName || owner.profileId,
                consenter: from.displayName,
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
} = {}): Promise<{ delivered: number; pending: number; skipped: number }> => {
    const deadline = Date.now() + budgetMs;
    const summary = { delivered: 0, pending: 0, skipped: 0 };
    const rows = await neogma.queryRunner.run(
        `
        MATCH (event:ConsentFlowEvent)-[:HAS_DELIVERY]->(delivery:ConsentFlowEventDelivery)
        WHERE delivery.state = 'pending' AND delivery.nextAttemptAt <= $now
            AND (delivery.leaseUntil IS NULL OR delivery.leaseUntil < $now)
            AND ($eventId IS NULL OR event.id = $eventId)
        RETURN event, delivery ORDER BY delivery.nextAttemptAt, delivery.id LIMIT $limit
    `,
        {
            now: new Date().toISOString(),
            eventId: eventId ?? null,
            limit: int(Math.max(1, Math.min(100, Math.trunc(limit)))),
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
            MATCH (delivery:ConsentFlowEventDelivery {id: $id})
            SET delivery.lock = coalesce(delivery.lock, 0) + 1
            WITH delivery WHERE delivery.state = 'pending' AND delivery.nextAttemptAt <= $now
                AND (delivery.leaseUntil IS NULL OR delivery.leaseUntil < $now)
            SET delivery.lease = $lease, delivery.leaseUntil = $leaseUntil
            RETURN delivery.id
        `,
            { id: delivery.id, now, lease, leaseUntil: new Date(Date.now() + 60_000).toISOString() }
        );
        if (!claimed.records.length) continue;
        let state = 'pending';
        try {
            const notification = await buildNotification(event, delivery);
            if (!notification) {
                state = 'skipped';
                summary.skipped++;
            } else {
                const delivered = await addNotificationToQueue(notification, {
                    propagateDirectWebhookTransportErrors: true,
                });
                if (delivered === false) throw new Error('Contract notification was not stored');
                state = 'delivered';
                summary.delivered++;
            }
        } catch {
            summary.pending++;
            // Never log request references, profile identifiers, or consent payloads.
            console.warn('contract_events: delivery_pending');
        }
        // History lives on Terms/Transactions; completed intents retain dedupe IDs only.
        await neogma.queryRunner.run(
            `
            MATCH (event:ConsentFlowEvent)-[:HAS_DELIVERY]->(delivery:ConsentFlowEventDelivery {id: $id}) WHERE delivery.lease = $lease
            SET delivery.state = $state, delivery.lease = null, delivery.leaseUntil = null,
                delivery.attempts = coalesce(delivery.attempts, 0) + 1, delivery.updatedAt = $now,
                delivery.nextAttemptAt = $nextAttemptAt
            WITH event
            WHERE NOT EXISTS {
                MATCH (event)-[:HAS_DELIVERY]->(remaining:ConsentFlowEventDelivery)
                WHERE remaining.state = 'pending'
            }
            SET event.payload = null, event.message = null
        `,
            {
                id: delivery.id,
                lease,
                state,
                now: new Date().toISOString(),
                nextAttemptAt: new Date(Date.now() + 60_000).toISOString(),
            }
        );
    }
    return summary;
};

/** A committed API mutation must succeed even if dispatch is temporarily unavailable. */
export const tryDispatchContractEvent = async (eventId: string): Promise<void> => {
    try {
        await dispatchContractEvents({ eventId, limit: 52, budgetMs: 1_000 });
    } catch {
        console.warn('contract_events: dispatch_pending');
    }
};
