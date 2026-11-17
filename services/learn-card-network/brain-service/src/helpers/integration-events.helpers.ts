import { randomUUID } from 'node:crypto';
import { int } from 'neo4j-driver';
import {
    IntegrationEventTypeValidator,
    IntegrationEventValidator,
    type IntegrationEvent,
    type IntegrationEventRole,
    type IntegrationEventType,
} from '@learncard/types';

import { neogma } from '@instance';
import { environment } from '@environment';
import { INTEGRATION_EVENT_RETENTION_MS } from 'src/constants/integration-events';
import { ensureContractEventMaintenance } from './contract-event-maintenance.helpers';
import {
    fetchNotificationWebhook,
    UnsafeNotificationWebhookError,
} from './notification-webhook-fetch.helpers';
import {
    INTEGRATION_WEBHOOK_DELIVERY_HEADER,
    INTEGRATION_WEBHOOK_EVENT_ID_HEADER,
    INTEGRATION_WEBHOOK_SIGNATURE_HEADER,
    buildSignatureHeader,
} from './integration-webhook-signature.helpers';

export {
    IntegrationEventCursorMismatchError,
    decodeIntegrationEventCursor,
    encodeIntegrationEventCursor,
} from './integration-event-cursor.helpers';

const defaultDomain = (): string => environment.DOMAIN_NAME ?? 'network.learncard.com';

const optionalString = (value: unknown): string | undefined =>
    typeof value === 'string' && value.length > 0 ? value : undefined;

/** Neo4j returns integers as Integer objects; plain numbers and bigints are accepted too. */
const toNumber = (value: unknown): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'bigint') return Number(value);
    if (value && typeof (value as { toNumber?: unknown }).toNumber === 'function') {
        return (value as { toNumber: () => number }).toNumber();
    }

    return Number(value);
};

/** Removes undefined values so a map can be passed to Neo4j as a parameter. */
const withoutUndefined = (input: Record<string, unknown>): Record<string, unknown> =>
    Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));

/**
 * Converts the stored properties of an IntegrationEvent node into the public record.
 * The result is both the feed record and the exact webhook body. Delivery bookkeeping
 * (deliveryState, attempts, lease, purgeAt, ...) is never part of it.
 */
export const toIntegrationEvent = (record: Record<string, unknown>): IntegrationEvent => {
    const termsUri = optionalString(record.termsUri);
    const subjectProfileId = optionalString(record.subjectProfileId);
    const subjectDid = optionalString(record.subjectDid);
    const subjectDidKey = optionalString(record.subjectDidKey);
    const requestId = optionalString(record.requestId);
    const externalReferenceId = optionalString(record.externalReferenceId);
    const reason = optionalString(record.reason);

    return IntegrationEventValidator.parse({
        eventId: record.eventId,
        deliveryKey: record.id,
        sequence: toNumber(record.sequence),
        type: record.type,
        contractUri: record.contractUri,
        ...(termsUri ? { termsUri } : {}),
        ...(subjectProfileId && subjectDid && subjectDidKey
            ? { subject: { profileId: subjectProfileId, did: subjectDid, didKey: subjectDidKey } }
            : {}),
        ...(requestId ? { requestId } : {}),
        ...(externalReferenceId ? { externalReferenceId } : {}),
        ...(reason ? { reason } : {}),
        role: record.role,
        occurredAt: record.occurredAt,
    });
};

export type IntegrationOnlyEventInput = {
    /** Deterministic event id, for example `${termsId}:expired`. A second call with the same id is a no-op. */
    id: string;
    kind: Exclude<IntegrationEventType, 'integration.test' | 'request_accepted'>;
    contractId: string;
    termsId?: string;
    /** Profile the event is about (the consenter or the request target). */
    subjectProfileId?: string;
    requestId?: string;
    requestedBy?: string;
    externalReferenceId?: string;
    reason?: string;
    /** ISO time the change happened. Defaults to now. */
    occurredAt?: string;
    domain?: string;
};

/**
 * Creates a ConsentFlowEvent that has no profile deliveries and is flagged for integration
 * fan-out, so only integrations see it. Returns true when the event was created by this call.
 */
export const createIntegrationOnlyEvent = async ({
    id,
    kind,
    contractId,
    termsId,
    subjectProfileId,
    requestId,
    requestedBy,
    externalReferenceId,
    reason,
    occurredAt,
    domain,
}: IntegrationOnlyEventInput): Promise<boolean> => {
    const result = await neogma.queryRunner.run(
        `MERGE (event:ConsentFlowEvent {id: $id})
         ON CREATE SET event += $props, event.integrationFanoutPending = true, event.createdNow = true
         WITH event, coalesce(event.createdNow, false) AS created
         REMOVE event.createdNow
         RETURN created`,
        {
            id,
            props: withoutUndefined({
                kind,
                contractId,
                termsId,
                targetId: subjectProfileId,
                requestId,
                requestedBy,
                externalReferenceId,
                reason,
                domain: domain ?? defaultDomain(),
                createdAt: occurredAt ?? new Date().toISOString(),
            }),
        }
    );

    return result.records[0]?.get('created') === true;
};

export type IntegrationFanOutSummary = {
    /** Flagged events that were processed and unflagged. */
    events: number;
    /** IntegrationEvent records created. */
    records: number;
};

const REQUEST_EVENT_TYPES: IntegrationEventType[] = [
    'request_sent',
    'request_denied',
    'request_cancelled',
];

const unique = (values: (string | undefined | null)[]): string[] => [
    ...new Set(
        values.filter((value): value is string => typeof value === 'string' && value !== '')
    ),
];

/** Writes one IntegrationEvent with the next sequence number. Returns true when it was created. */
const writeIntegrationEvent = async (
    integrationId: string,
    id: string,
    props: Record<string, unknown>
): Promise<boolean> => {
    const now = new Date();
    const result = await neogma.queryRunner.run(
        `MATCH (integration:Integration {id: $integrationId})
         SET integration.eventSeqLock = coalesce(integration.eventSeqLock, 0) + 1
         WITH integration, coalesce(integration.eventSeq, 0) + 1 AS nextSeq
         MERGE (record:IntegrationEvent {id: $id})
         ON CREATE SET record += $props, record.sequence = nextSeq, record.createdNow = true,
             record.deliveryState = CASE WHEN integration.webhookUrl IS NULL THEN 'none' ELSE 'pending' END
         WITH integration, record, nextSeq, coalesce(record.createdNow, false) AS created
         FOREACH (_ IN CASE WHEN created THEN [1] ELSE [] END | SET integration.eventSeq = nextSeq)
         REMOVE record.createdNow
         RETURN created`,
        {
            integrationId,
            id,
            props: withoutUndefined({
                ...props,
                integrationId,
                createdAt: now.toISOString(),
                purgeAt: new Date(now.getTime() + INTEGRATION_EVENT_RETENTION_MS).toISOString(),
                attempts: int(0),
                nextAttemptAt: now.toISOString(),
            }),
        }
    );

    return result.records[0]?.get('created') === true;
};

/** Fans one flagged event out to every subscribed integration. Returns the records created. */
const fanOutEvent = async (event: Record<string, unknown>): Promise<number> => {
    const type = IntegrationEventTypeValidator.safeParse(event.kind);
    const eventId = optionalString(event.id);
    const contractId = optionalString(event.contractId);
    const createdAt = optionalString(event.createdAt);

    if (!type.success || type.data === 'integration.test' || type.data === 'request_accepted') {
        return 0;
    }
    if (!eventId || !contractId || !createdAt || Number.isNaN(Date.parse(createdAt))) return 0;

    const termsId = optionalString(event.termsId);
    const audience = await neogma.queryRunner.run(
        `MATCH (contract:ConsentFlowContract {id: $contractId})-[:CREATED_BY]->(owner:Profile)
         OPTIONAL MATCH (contract)-[:CAN_WRITE]->(writer:Profile)
         WITH contract, owner, collect(DISTINCT writer.profileId) AS writerIds
         OPTIONAL MATCH (contract)-[:SHARES_DATA_WITH]->(recipient:Profile)
         WITH contract, owner, writerIds, collect(DISTINCT recipient.profileId) AS recipientIds
         OPTIONAL MATCH (contract)<-[:CONSENTS_TO]-(:ConsentFlowTerms {id: $termsId})<-[:CREATED_BY]-(consenter:Profile)
         RETURN owner.profileId AS ownerId, writerIds, recipientIds,
             head(collect(consenter.profileId)) AS consenterId`,
        { contractId, termsId: termsId ?? null }
    );
    const row = audience.records[0];

    if (!row) return 0;

    const ownerId: string = row.get('ownerId');
    const writerIds: string[] = row.get('writerIds');
    const recipientIds: string[] = row.get('recipientIds');
    const consenterId = optionalString(row.get('consenterId'));
    const requesterId = optionalString(event.requestedBy);

    // A profile with several roles gets one, in this order.
    const roleOf = (profileId: string): IntegrationEventRole | undefined => {
        if (profileId === ownerId) return 'owner';
        if (writerIds.includes(profileId)) return 'writer';
        if (recipientIds.includes(profileId)) return 'recipient';
        if (profileId === requesterId) return 'requester';

        return undefined;
    };

    const isRequestEvent = REQUEST_EVENT_TYPES.includes(type.data);
    const mainProfiles = unique(
        isRequestEvent
            ? [ownerId, requesterId]
            : [ownerId, ...writerIds, ...recipientIds, requesterId]
    );
    const acceptedProfiles = event.requestAccepted === true ? unique([ownerId, requesterId]) : [];

    const integrations = await neogma.queryRunner.run(
        `UNWIND $profileIds AS profileId
         MATCH (integration:Integration)-[:CREATED_BY]->(:Profile {profileId: profileId})
         WHERE integration.contractEventsEnabledAt IS NOT NULL
             AND datetime(integration.contractEventsEnabledAt) <= datetime($createdAt)
         RETURN DISTINCT integration.id AS integrationId, profileId
         ORDER BY integrationId`,
        { profileIds: unique([...mainProfiles, ...acceptedProfiles]), createdAt }
    );

    if (integrations.records.length === 0) return 0;

    const { constructUri } = await import('./uri.helpers');
    const { getDidWeb } = await import('./did.helpers');
    const domain = optionalString(event.domain) ?? defaultDomain();
    const contractUri = constructUri('contract', contractId, domain);
    const termsUri = termsId ? constructUri('terms', termsId, domain) : undefined;

    const subjectId =
        event.subjectHidden === true ? undefined : (optionalString(event.targetId) ?? consenterId);
    let subject: Record<string, unknown> = {};

    if (subjectId) {
        const found = await neogma.queryRunner.run(
            'MATCH (profile:Profile {profileId: $profileId}) RETURN profile.did AS did LIMIT 1',
            { profileId: subjectId }
        );
        const didKey = optionalString(found.records[0]?.get('did'));

        if (didKey) {
            subject = {
                subjectProfileId: subjectId,
                subjectDid: getDidWeb(domain, subjectId),
                subjectDidKey: didKey,
            };
        }
    }

    let created = 0;

    for (const record of integrations.records) {
        const integrationId: string = record.get('integrationId');
        const profileId: string = record.get('profileId');
        const role = roleOf(profileId);

        if (!role) continue;

        // Same rule as profile notifications: another referrer's reference stays private.
        const seesReference = role === 'owner' || role === 'writer' || profileId === requesterId;
        const shared = {
            eventId,
            contractUri,
            ...subject,
            requestId: optionalString(event.requestId),
            externalReferenceId: seesReference
                ? optionalString(event.externalReferenceId)
                : undefined,
            role,
            occurredAt: createdAt,
        };

        // The acceptance record is written first so it has the lower sequence number.
        if (acceptedProfiles.includes(profileId)) {
            const wasCreated = await writeIntegrationEvent(
                integrationId,
                `${eventId}:accepted:${integrationId}`,
                { ...shared, type: 'request_accepted' }
            );
            if (wasCreated) created++;
        }

        if (mainProfiles.includes(profileId)) {
            const wasCreated = await writeIntegrationEvent(
                integrationId,
                `${eventId}:${integrationId}`,
                {
                    ...shared,
                    type: type.data,
                    termsUri: role === 'requester' ? undefined : termsUri,
                    reason: optionalString(event.reason),
                }
            );
            if (wasCreated) created++;
        }
    }

    return created;
};

/**
 * About three days of retries (the delay reaches its 1-hour cap after seven attempts). Giving up
 * leaves a gap in the feed, so it must outlast a bad deploy or a long incident.
 */
export const MAX_FANOUT_ATTEMPTS = 80;
const FANOUT_INITIAL_RETRY_DELAY_MS = 60_000;
const FANOUT_MAX_RETRY_DELAY_MS = 60 * 60_000;

/**
 * Turns every ConsentFlowEvent flagged with integrationFanoutPending into one IntegrationEvent
 * per subscribed integration, then removes the flag. Safe to run concurrently and to retry:
 * records are MERGEd by id and a sequence number is only consumed when a record is created.
 *
 * Events are always taken oldest first. With `eventId`, the pass covers that event and every
 * older flagged event of the same contract; with `contractId`, every flagged event of that
 * contract. This keeps a contract's feed in the order things happened even when an earlier
 * event (for example one written by a scheduled job) was still waiting for the worker.
 *
 * A failing event is retried with a backoff (60 seconds doubling to 1 hour) and given up on
 * after MAX_FANOUT_ATTEMPTS (about three days): the flag is removed and
 * integrationFanoutFailedAt is set, so the event can be found and re-flagged by hand.
 * An event in backoff is skipped by every variant, so one failing event cannot hold back the
 * rest of its contract; that event then reaches the feed later than newer ones.
 */
export const fanOutIntegrationEvents = async ({
    eventId,
    contractId,
    limit = 100,
    budgetMs = 20_000,
}: {
    eventId?: string;
    contractId?: string;
    limit?: number;
    budgetMs?: number;
} = {}): Promise<IntegrationFanOutSummary> => {
    const deadline = Date.now() + budgetMs;
    const summary: IntegrationFanOutSummary = { events: 0, records: 0 };
    const batchLimit = int(Math.max(1, Math.min(500, Math.trunc(limit))));

    if (!eventId && !contractId) await ensureContractEventMaintenance();

    // An event that failed is not due again until its backoff has passed, so a few failing
    // events cannot fill the batch and starve newer ones. The set behind the index seek is only
    // the flagged events, which is small; the filter and the sort run on that set.
    const pending = await neogma.queryRunner.run(
        eventId
            ? `MATCH (target:ConsentFlowEvent {id: $eventId})
               WHERE target.integrationFanoutPending = true
               MATCH (event:ConsentFlowEvent)
               WHERE event.integrationFanoutPending = true
                   AND (event.integrationFanoutNextAt IS NULL OR event.integrationFanoutNextAt <= $now)
                   AND (event.id = target.id OR (event.contractId = target.contractId
                       AND event.createdAt < target.createdAt))
               RETURN event ORDER BY event.createdAt, event.id LIMIT $limit`
            : contractId
              ? `MATCH (event:ConsentFlowEvent)
                 WHERE event.integrationFanoutPending = true AND event.contractId = $contractId
                     AND (event.integrationFanoutNextAt IS NULL OR event.integrationFanoutNextAt <= $now)
                 RETURN event ORDER BY event.createdAt, event.id LIMIT $limit`
              : `MATCH (event:ConsentFlowEvent)
                 USING INDEX event:ConsentFlowEvent(integrationFanoutPending)
                 WHERE event.integrationFanoutPending = true
                     AND (event.integrationFanoutNextAt IS NULL OR event.integrationFanoutNextAt <= $now)
                 RETURN event ORDER BY coalesce(event.integrationFanoutNextAt, event.createdAt), event.id
                 LIMIT $limit`,
        {
            eventId: eventId ?? null,
            contractId: contractId ?? null,
            limit: batchLimit,
            now: new Date().toISOString(),
        }
    );

    for (const row of pending.records) {
        if (Date.now() >= deadline) break;

        const event: Record<string, unknown> = row.get('event').properties;

        try {
            summary.records += await fanOutEvent(event);
            await neogma.queryRunner.run(
                `MATCH (event:ConsentFlowEvent {id: $id})
                 REMOVE event.integrationFanoutPending, event.integrationFanoutAttempts,
                     event.integrationFanoutNextAt`,
                { id: event.id }
            );
            summary.events++;
        } catch {
            // Never log identifiers.
            const attempts =
                (event.integrationFanoutAttempts === undefined
                    ? 0
                    : toNumber(event.integrationFanoutAttempts)) + 1;
            const abandoned = attempts >= MAX_FANOUT_ATTEMPTS;
            const delayMs = Math.min(
                FANOUT_INITIAL_RETRY_DELAY_MS * 2 ** (attempts - 1),
                FANOUT_MAX_RETRY_DELAY_MS
            );

            console.warn(
                abandoned
                    ? 'integration_events: fanout_abandoned'
                    : 'integration_events: fanout_pending'
            );

            try {
                await neogma.queryRunner.run(
                    `MATCH (event:ConsentFlowEvent {id: $id})
                     SET event.integrationFanoutAttempts =
                         coalesce(event.integrationFanoutAttempts, 0) + 1
                     WITH event
                     FOREACH (_ IN CASE WHEN event.integrationFanoutAttempts >= $maxAttempts THEN [1] ELSE [] END |
                         REMOVE event.integrationFanoutPending, event.integrationFanoutNextAt
                         SET event.integrationFanoutFailedAt = $now)
                     FOREACH (_ IN CASE WHEN event.integrationFanoutAttempts < $maxAttempts THEN [1] ELSE [] END |
                         SET event.integrationFanoutNextAt = $nextAt)`,
                    {
                        id: event.id,
                        maxAttempts: int(MAX_FANOUT_ATTEMPTS),
                        now: new Date().toISOString(),
                        nextAt: new Date(Date.now() + delayMs).toISOString(),
                    }
                );
            } catch {
                // The flag stays set without a backoff, so the next pass retries this event.
                console.warn('integration_events: fanout_backoff_failed');
            }
        }
    }

    return summary;
};

export type IntegrationEventPurgeSummary = {
    deleted: number;
    /** true when the budget ran out right after a full batch, so more expired records may remain. */
    hasMore: boolean;
};

/**
 * Deletes IntegrationEvent records older than the retention window, in batches, and records
 * on each Integration the highest sequence number removed (eventPurgedThroughSeq).
 */
export const purgeExpiredIntegrationEvents = async ({
    limit = 500,
    budgetMs = 20_000,
    now = new Date(),
}: {
    limit?: number;
    budgetMs?: number;
    now?: Date;
} = {}): Promise<IntegrationEventPurgeSummary> => {
    const deadline = Date.now() + budgetMs;
    const batchSize = Math.max(1, Math.min(1_000, Math.trunc(limit)));
    const summary: IntegrationEventPurgeSummary = { deleted: 0, hasMore: false };

    await ensureContractEventMaintenance();

    // Order matters inside the statement: the watermark is written (which takes the write lock
    // of the Integration node) before any of its records is deleted, and both commit together.
    // readIntegrationEventPage takes the same lock, so a feed read sees either none of a batch
    // or all of it together with the advanced watermark.
    do {
        const result = await neogma.queryRunner.run(
            `MATCH (record:IntegrationEvent)
             USING INDEX record:IntegrationEvent(purgeAt)
             WHERE record.purgeAt <= $now
             WITH record ORDER BY record.purgeAt LIMIT $limit
             WITH record.integrationId AS integrationId, max(record.sequence) AS maxSeq,
                 collect(record) AS records, count(record) AS total
             OPTIONAL MATCH (integration:Integration {id: integrationId})
             FOREACH (_ IN CASE WHEN integration IS NULL THEN [] ELSE [1] END |
                 SET integration.eventPurgedThroughSeq = CASE
                     WHEN coalesce(integration.eventPurgedThroughSeq, 0) > maxSeq
                     THEN integration.eventPurgedThroughSeq ELSE maxSeq END)
             FOREACH (record IN records | DETACH DELETE record)
             RETURN sum(total) AS deleted`,
            { now: now.toISOString(), limit: int(batchSize) }
        );
        const deleted = toNumber(result.records[0]?.get('deleted') ?? 0);

        summary.deleted += deleted;

        summary.hasMore = deleted >= batchSize;

        if (!summary.hasMore) break;
    } while (Date.now() < deadline);

    return summary;
};

export type IntegrationEventPassSummary = IntegrationFanOutSummary &
    IntegrationWebhookDispatchSummary;

/** One worker pass over the integration channel: fan out flagged events, then deliver webhooks. */
export const runIntegrationEventPass = async ({
    limit = 100,
    budgetMs = 20_000,
}: {
    limit?: number;
    budgetMs?: number;
} = {}): Promise<IntegrationEventPassSummary> => {
    const startedAt = Date.now();
    const fanOut = await fanOutIntegrationEvents({ limit, budgetMs });
    const delivery = await dispatchIntegrationWebhooks({
        limit,
        budgetMs: Math.max(0, budgetMs - (Date.now() - startedAt)),
    });

    return { ...fanOut, ...delivery };
};

const WEBHOOK_TIMEOUT_MS = 6_000;

export type IntegrationWebhookSendResult = {
    delivered: boolean;
    /** HTTP status, when the receiver answered. */
    status?: number;
    /** false when retrying cannot help (bad URL, or a 4xx other than 408, 425, 429). */
    retryable: boolean;
    /** Short fixed code such as http_500, timeout, network_error, invalid_webhook. Never a URL. */
    error?: string;
};

/**
 * POSTs one event to a webhook URL with an HMAC signature. The body is JSON.stringify(event)
 * and the signature is computed over exactly that string. Any 2xx answer is a delivery.
 * Never throws: every failure is reported in the result.
 */
export const sendSignedIntegrationWebhook = async ({
    webhookUrl,
    secrets,
    event,
    timeoutMs = WEBHOOK_TIMEOUT_MS,
}: {
    webhookUrl: string;
    secrets: string[];
    event: IntegrationEvent;
    timeoutMs?: number;
}): Promise<IntegrationWebhookSendResult> => {
    const body = JSON.stringify(event);
    const timestamp = Math.floor(Date.now() / 1000);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetchNotificationWebhook(
            webhookUrl,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    [INTEGRATION_WEBHOOK_SIGNATURE_HEADER]: buildSignatureHeader({
                        secrets,
                        timestamp,
                        body,
                    }),
                    [INTEGRATION_WEBHOOK_EVENT_ID_HEADER]: event.eventId,
                    [INTEGRATION_WEBHOOK_DELIVERY_HEADER]: event.deliveryKey,
                },
                body,
                signal: controller.signal,
            },
            environment.IS_OFFLINE
        );

        // Keep the deadline active while the answer is read. Its content is not used.
        await response.text();

        if (response.ok) return { delivered: true, status: response.status, retryable: false };

        const isFinal =
            response.status >= 400 &&
            response.status < 500 &&
            ![408, 425, 429].includes(response.status);

        return {
            delivered: false,
            status: response.status,
            retryable: !isFinal,
            error: `http_${response.status}`,
        };
    } catch (error) {
        if (error instanceof UnsafeNotificationWebhookError) {
            return { delivered: false, retryable: false, error: 'invalid_webhook' };
        }

        return {
            delivered: false,
            retryable: true,
            error: controller.signal.aborted ? 'timeout' : 'network_error',
        };
    } finally {
        clearTimeout(timeoutId);
    }
};

const MAX_WEBHOOK_ATTEMPTS = 12;
const WEBHOOK_RETRY_WINDOW_MS = 24 * 60 * 60_000;
const WEBHOOK_INITIAL_RETRY_DELAY_MS = 60_000;
const WEBHOOK_MAX_RETRY_DELAY_MS = 60 * 60_000;
const WEBHOOK_LEASE_MS = 60_000;
/** Most due records one integration can have claimed in a single pass. */
const MAX_WEBHOOK_CLAIMS_PER_INTEGRATION = 5;

/**
 * Round-robin over per-integration lists: every integration's first record comes before any
 * integration's second. Integrations are ordered by their oldest due record.
 */
const interleaveByIntegration = (
    groups: Record<string, unknown>[][]
): Record<string, unknown>[] => {
    const ordered = groups
        .filter(group => group.length > 0)
        .sort((a, b) =>
            `${a[0]?.nextAttemptAt}|${a[0]?.id}`.localeCompare(`${b[0]?.nextAttemptAt}|${b[0]?.id}`)
        );
    const result: Record<string, unknown>[] = [];

    for (let round = 0; ordered.some(group => group.length > round); round++) {
        for (const group of ordered) {
            const record = group[round];

            if (record) result.push(record);
        }
    }

    return result;
};

export type IntegrationWebhookDispatchSummary = {
    delivered: number;
    /** Failed this time and scheduled for another attempt. */
    pending: number;
    /** Final: the receiver refused it, or the integration has no webhook or has events disabled. */
    rejected: number;
    /** Final: 12 attempts or 24 hours were used up. */
    failed: number;
};

type WebhookDeliveryConfig = {
    webhookUrl: string;
    secrets: string[];
    contractEventsEnabledAt?: string;
};

/**
 * true when a feed record must not be delivered because contract events are disabled, or were
 * disabled after the record's event happened (fan-out only writes records for events at or
 * after contractEventsEnabledAt, so an older record means a disable in between).
 */
const isDeliveryDisabled = (config: WebhookDeliveryConfig, occurredAt: unknown): boolean => {
    if (!config.contractEventsEnabledAt) return true;

    const enabledAtMs = Date.parse(config.contractEventsEnabledAt);
    const occurredAtMs = Date.parse(String(occurredAt));

    if (Number.isNaN(enabledAtMs)) return true;

    return !Number.isNaN(occurredAtMs) && occurredAtMs < enabledAtMs;
};

/**
 * Sends pending IntegrationEvent records to their integration's webhook, at least once.
 * A 60-second lease fences overlapping workers. The retry policy matches the profile outbox:
 * up to 12 attempts within 24 hours, 60 seconds doubling to a 1-hour cap. Records of an
 * integration whose contract events are disabled are not sent: they become final `rejected`
 * with failureReason `disabled`. A failed or refused delivery only changes delivery
 * bookkeeping; the record always stays in the feed.
 */
export const dispatchIntegrationWebhooks = async ({
    limit = 100,
    budgetMs = 20_000,
}: {
    limit?: number;
    budgetMs?: number;
} = {}): Promise<IntegrationWebhookDispatchSummary> => {
    const deadline = Date.now() + budgetMs;
    const summary: IntegrationWebhookDispatchSummary = {
        delivered: 0,
        pending: 0,
        rejected: 0,
        failed: 0,
    };

    await ensureContractEventMaintenance();

    const batchLimit = Math.max(1, Math.min(500, Math.trunc(limit)));
    // Read a bounded window of the oldest due records through the index, then keep a few per
    // integration, so one integration's backlog cannot take the whole pass.
    const due = await neogma.queryRunner.run(
        `MATCH (record:IntegrationEvent)
         USING INDEX record:IntegrationEvent(deliveryState, nextAttemptAt)
         WHERE record.deliveryState = 'pending' AND record.nextAttemptAt <= $now
             AND (record.leaseUntil IS NULL OR record.leaseUntil < $now)
         WITH record ORDER BY record.nextAttemptAt, record.id LIMIT $candidates
         WITH record.integrationId AS integrationId, collect(record) AS records
         RETURN integrationId, records[0..$perIntegration] AS records`,
        {
            now: new Date().toISOString(),
            candidates: int(batchLimit * 5),
            perIntegration: int(MAX_WEBHOOK_CLAIMS_PER_INTEGRATION),
        }
    );

    const dueRecords = interleaveByIntegration(
        due.records.map(row =>
            (row.get('records') as { properties: Record<string, unknown> }[]).map(
                node => node.properties
            )
        )
    ).slice(0, batchLimit);

    if (dueRecords.length === 0) return summary;

    // Loaded lazily: decrypting secrets pulls in the wallet stack (rule 11).
    const { getIntegrationWebhookDeliverySnapshot, getIntegrationWebhookDeliveryFingerprint } =
        await import('@accesslayer/integration/webhook');
    // Cached for the pass, but re-validated before every send: the owner may disable events or
    // change the URL or secret while the pass runs, and that must apply to the very next delivery.
    const configs = new Map<
        string,
        { fingerprint: string | null; config: WebhookDeliveryConfig | null }
    >();

    for (const record of dueRecords) {
        if (Date.now() >= deadline) break;

        const id = String(record.id);
        const integrationId = String(record.integrationId);
        const lease = randomUUID();
        const claimed = await neogma.queryRunner.run(
            `MATCH (record:IntegrationEvent {id: $id})
             SET record.lock = coalesce(record.lock, 0) + 1
             WITH record WHERE record.deliveryState = 'pending' AND record.nextAttemptAt <= $now
                 AND (record.leaseUntil IS NULL OR record.leaseUntil < $now)
             WITH record, coalesce(record.attempts, 0) AS previousAttempts
             SET record.lease = $lease, record.leaseUntil = $leaseUntil,
                 record.attempts = CASE WHEN previousAttempts < $maxAttempts
                     THEN previousAttempts + 1 ELSE previousAttempts END
             RETURN previousAttempts`,
            {
                id,
                now: new Date().toISOString(),
                lease,
                leaseUntil: new Date(Date.now() + WEBHOOK_LEASE_MS).toISOString(),
                maxAttempts: int(MAX_WEBHOOK_ATTEMPTS),
            }
        );

        if (claimed.records.length === 0) continue;

        // Claims are counted, including abandoned leases, so a crash cannot reset the budget.
        const previousAttempts = toNumber(claimed.records[0]?.get('previousAttempts'));
        const attempts = Math.min(previousAttempts + 1, MAX_WEBHOOK_ATTEMPTS);
        const createdAtMs = Date.parse(String(record.createdAt));
        const retryWindowEndsAt =
            (Number.isNaN(createdAtMs) ? Date.now() : createdAtMs) + WEBHOOK_RETRY_WINDOW_MS;

        let state: 'pending' | 'delivered' | 'rejected' | 'failed' = 'pending';
        let failureReason: string | null = null;
        let lastStatus: number | null = null;

        try {
            if (retryWindowEndsAt <= Date.now() || previousAttempts >= MAX_WEBHOOK_ATTEMPTS) {
                state = 'failed';
                failureReason =
                    retryWindowEndsAt <= Date.now() ? 'retry_expired' : 'retry_exhausted';
            } else {
                let entry = configs.get(integrationId);

                if (
                    !entry ||
                    (await getIntegrationWebhookDeliveryFingerprint(integrationId)) !==
                        entry.fingerprint
                ) {
                    entry = await getIntegrationWebhookDeliverySnapshot(integrationId);
                    configs.set(integrationId, entry);
                }

                const config = entry.config;

                if (!config) {
                    state = 'rejected';
                    failureReason = 'no_webhook';
                } else if (isDeliveryDisabled(config, record.occurredAt)) {
                    // Disabling contract events also stops records that are already queued.
                    state = 'rejected';
                    failureReason = 'disabled';
                } else {
                    const result = await sendSignedIntegrationWebhook({
                        webhookUrl: config.webhookUrl,
                        secrets: config.secrets,
                        event: toIntegrationEvent(record),
                    });

                    lastStatus = result.status ?? null;

                    if (result.delivered) {
                        state = 'delivered';
                    } else {
                        failureReason = result.error ?? 'delivery_failed';
                        if (!result.retryable) state = 'rejected';
                        else if (attempts >= MAX_WEBHOOK_ATTEMPTS) state = 'failed';
                    }
                }
            }
        } catch {
            failureReason = 'delivery_error';
            if (attempts >= MAX_WEBHOOK_ATTEMPTS) state = 'failed';
        }

        summary[state]++;

        // Never log URLs, secrets, profile identifiers or reference IDs.
        if (state !== 'delivered') console.warn(`integration_events: delivery_${state}`);

        const nextAttemptAt =
            state === 'pending'
                ? new Date(
                      Math.min(
                          Date.now() +
                              Math.min(
                                  WEBHOOK_INITIAL_RETRY_DELAY_MS * 2 ** (attempts - 1),
                                  WEBHOOK_MAX_RETRY_DELAY_MS
                              ),
                          retryWindowEndsAt
                      )
                  ).toISOString()
                : null;

        await neogma.queryRunner.run(
            `MATCH (record:IntegrationEvent {id: $id})
             WHERE record.lease = $lease
             SET record.deliveryState = $state, record.lease = null, record.leaseUntil = null,
                 record.lastStatus = $lastStatus, record.failureReason = $failureReason,
                 record.nextAttemptAt = $nextAttemptAt, record.updatedAt = $now`,
            {
                id,
                lease,
                state,
                lastStatus: lastStatus === null ? null : int(lastStatus),
                failureReason,
                nextAttemptAt,
                now: new Date().toISOString(),
            }
        );
    }

    return summary;
};
