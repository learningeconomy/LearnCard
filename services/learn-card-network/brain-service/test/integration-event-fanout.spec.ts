import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { neogma } from '@instance';
import { getDidWeb } from '@helpers/did.helpers';
import { constructUri } from '@helpers/uri.helpers';
import {
    MAX_FANOUT_ATTEMPTS,
    createIntegrationOnlyEvent,
    fanOutIntegrationEvents,
    toIntegrationEvent,
} from '@helpers/integration-events.helpers';

const DOMAIN = 'localhost%3A3000';
const ENABLED_AT = '2026-01-01T00:00:00.000Z';
const OCCURRED_AT = '2026-02-01T00:00:00.000Z';

const run = (query: string, params: Record<string, unknown> = {}) =>
    neogma.queryRunner.run(query, params);

/** Feed records of one integration, in sequence order, as public IntegrationEvent objects. */
const recordsFor = async (integrationId: string) => {
    const result = await run(
        `MATCH (record:IntegrationEvent {integrationId: $integrationId})
         RETURN record ORDER BY record.sequence`,
        { integrationId }
    );

    return result.records.map(row => toIntegrationEvent(row.get('record').properties));
};

const storedFor = async (integrationId: string): Promise<Record<string, unknown>[]> => {
    const result = await run(
        `MATCH (record:IntegrationEvent {integrationId: $integrationId})
         RETURN record ORDER BY record.sequence`,
        { integrationId }
    );

    return result.records.map(row => row.get('record').properties);
};

const isFlagged = async (eventId: string): Promise<boolean> => {
    const result = await run(
        'MATCH (event:ConsentFlowEvent {id: $eventId}) RETURN event.integrationFanoutPending AS flag',
        { eventId }
    );

    return result.records[0]?.get('flag') === true;
};

// The first hook also boots the wallet and the database connection, which can be slow.
vi.setConfig({ hookTimeout: 30_000 });

describe('fanOutIntegrationEvents', () => {
    beforeEach(async () => {
        await run(
            `MATCH (n) WHERE n:IntegrationEvent OR n:ConsentFlowEvent OR n:Integration OR n:Profile
                 OR n:ConsentFlowContract OR n:ConsentFlowTerms
             DETACH DELETE n`
        );
        await run(
            `CREATE (owner:Profile {profileId: 'fan-owner', did: 'did:key:owner'}),
                 (writer:Profile {profileId: 'fan-writer', did: 'did:key:writer'}),
                 (recipient:Profile {profileId: 'fan-recipient', did: 'did:key:recipient'}),
                 (requester:Profile {profileId: 'fan-requester', did: 'did:key:requester'}),
                 (veteran:Profile {profileId: 'fan-veteran', did: 'did:key:veteran'}),
                 (contract:ConsentFlowContract {id: 'fan-contract'}),
                 (contract)-[:CREATED_BY]->(owner),
                 (contract)-[:CAN_WRITE]->(writer),
                 (contract)-[:SHARES_DATA_WITH]->(recipient),
                 (terms:ConsentFlowTerms {id: 'fan-terms', status: 'live'}),
                 (veteran)-[:CREATED_BY]->(terms),
                 (terms)-[:CONSENTS_TO]->(contract),
                 (ownerIntegration:Integration {id: 'int-owner', contractEventsEnabledAt: $enabledAt,
                     webhookUrl: 'https://hooks.example.com/owner'}),
                 (ownerIntegration)-[:CREATED_BY]->(owner),
                 (writerIntegration:Integration {id: 'int-writer', contractEventsEnabledAt: $enabledAt}),
                 (writerIntegration)-[:CREATED_BY]->(writer),
                 (recipientIntegration:Integration {id: 'int-recipient', contractEventsEnabledAt: $enabledAt}),
                 (recipientIntegration)-[:CREATED_BY]->(recipient),
                 (requesterIntegration:Integration {id: 'int-requester', contractEventsEnabledAt: $enabledAt}),
                 (requesterIntegration)-[:CREATED_BY]->(requester),
                 (disabled:Integration {id: 'int-disabled'}),
                 (disabled)-[:CREATED_BY]->(owner),
                 (late:Integration {id: 'int-late', contractEventsEnabledAt: '2026-03-01T00:00:00.000Z'}),
                 (late)-[:CREATED_BY]->(owner),
                 (veteranIntegration:Integration {id: 'int-veteran', contractEventsEnabledAt: $enabledAt}),
                 (veteranIntegration)-[:CREATED_BY]->(veteran)`,
            { enabledAt: ENABLED_AT }
        );
    });

    it('creates one record per subscribed integration with role, subject and redaction', async () => {
        await createIntegrationOnlyEvent({
            id: 'event-consent',
            kind: 'consent_withdrawn',
            contractId: 'fan-contract',
            termsId: 'fan-terms',
            requestId: 'request-1',
            requestedBy: 'fan-requester',
            externalReferenceId: 'case-9',
            reason: 'contract_retired',
            occurredAt: OCCURRED_AT,
            domain: DOMAIN,
        });

        const summary = await fanOutIntegrationEvents({ limit: 10, budgetMs: 20_000 });

        expect(summary).toEqual({ events: 1, records: 4 });
        expect(await isFlagged('event-consent')).toBe(false);

        const subject = {
            profileId: 'fan-veteran',
            did: getDidWeb(DOMAIN, 'fan-veteran'),
            didKey: 'did:key:veteran',
        };
        const contractUri = constructUri('contract', 'fan-contract', DOMAIN);
        const termsUri = constructUri('terms', 'fan-terms', DOMAIN);

        expect(await recordsFor('int-owner')).toEqual([
            {
                eventId: 'event-consent',
                deliveryKey: 'event-consent:int-owner',
                sequence: 1,
                type: 'consent_withdrawn',
                contractUri,
                termsUri,
                subject,
                requestId: 'request-1',
                externalReferenceId: 'case-9',
                reason: 'contract_retired',
                role: 'owner',
                occurredAt: OCCURRED_AT,
            },
        ]);

        const [writerRecord] = await recordsFor('int-writer');
        expect(writerRecord?.role).toBe('writer');
        expect(writerRecord?.externalReferenceId).toBe('case-9');

        // A data recipient who is not the requester does not see another referrer's reference.
        const [recipientRecord] = await recordsFor('int-recipient');
        expect(recipientRecord?.role).toBe('recipient');
        expect(recipientRecord?.requestId).toBe('request-1');
        expect(recipientRecord).not.toHaveProperty('externalReferenceId');
        expect(recipientRecord?.termsUri).toBe(termsUri);

        // The requester sees the reference and the subject, but not the terms URI.
        const [requesterRecord] = await recordsFor('int-requester');
        expect(requesterRecord?.role).toBe('requester');
        expect(requesterRecord?.externalReferenceId).toBe('case-9');
        expect(requesterRecord?.subject).toEqual(subject);
        expect(requesterRecord).not.toHaveProperty('termsUri');

        // Not enabled, enabled after the event, or not part of the audience: nothing.
        expect(await recordsFor('int-disabled')).toEqual([]);
        expect(await recordsFor('int-late')).toEqual([]);
        expect(await recordsFor('int-veteran')).toEqual([]);
    });

    it('sets deliveryState from the webhook URL and stores retention bookkeeping', async () => {
        await createIntegrationOnlyEvent({
            id: 'event-state',
            kind: 'contract_retired',
            contractId: 'fan-contract',
            occurredAt: OCCURRED_AT,
            domain: DOMAIN,
        });
        await fanOutIntegrationEvents();

        const [withWebhook] = await storedFor('int-owner');
        const [withoutWebhook] = await storedFor('int-writer');

        expect(withWebhook?.deliveryState).toBe('pending');
        expect(withoutWebhook?.deliveryState).toBe('none');
        expect(typeof withWebhook?.nextAttemptAt).toBe('string');
        expect(Number(withWebhook?.attempts)).toBe(0);

        const retentionMs =
            new Date(String(withWebhook?.purgeAt)).getTime() -
            new Date(String(withWebhook?.createdAt)).getTime();
        expect(retentionMs).toBe(30 * 24 * 60 * 60 * 1000);

        // contract_retired has no terms and no subject.
        const [publicRecord] = await recordsFor('int-owner');
        expect(publicRecord).not.toHaveProperty('subject');
        expect(publicRecord).not.toHaveProperty('termsUri');
    });

    it('allocates increasing sequence numbers per integration in event order', async () => {
        await createIntegrationOnlyEvent({
            id: 'event-b',
            kind: 'consent_suspended',
            contractId: 'fan-contract',
            termsId: 'fan-terms',
            occurredAt: '2026-02-02T00:00:00.000Z',
            domain: DOMAIN,
        });
        await createIntegrationOnlyEvent({
            id: 'event-a',
            kind: 'consent_paused',
            contractId: 'fan-contract',
            termsId: 'fan-terms',
            reason: 'needs_reconsent',
            occurredAt: '2026-02-01T00:00:00.000Z',
            domain: DOMAIN,
        });

        await fanOutIntegrationEvents();

        const records = await recordsFor('int-owner');

        expect(records.map(record => [record.sequence, record.type])).toEqual([
            [1, 'consent_paused'],
            [2, 'consent_suspended'],
        ]);

        const seq = await run(
            "MATCH (integration:Integration {id: 'int-owner'}) RETURN integration.eventSeq AS seq"
        );
        expect(Number(seq.records[0]?.get('seq'))).toBe(2);
    });

    it('is idempotent when an event is fanned out again', async () => {
        await createIntegrationOnlyEvent({
            id: 'event-again',
            kind: 'consent_expired',
            contractId: 'fan-contract',
            termsId: 'fan-terms',
            occurredAt: OCCURRED_AT,
            domain: DOMAIN,
        });
        await fanOutIntegrationEvents();

        // Simulate a crash after the records were written but before the flag was removed.
        await run(
            "MATCH (event:ConsentFlowEvent {id: 'event-again'}) SET event.integrationFanoutPending = true"
        );
        const summary = await fanOutIntegrationEvents();

        expect(summary).toEqual({ events: 1, records: 0 });
        expect(await recordsFor('int-owner')).toHaveLength(1);

        const seq = await run(
            "MATCH (integration:Integration {id: 'int-owner'}) RETURN integration.eventSeq AS seq"
        );
        expect(Number(seq.records[0]?.get('seq'))).toBe(1);

        // createIntegrationOnlyEvent itself is a no-op for an id that already exists.
        await expect(
            createIntegrationOnlyEvent({
                id: 'event-again',
                kind: 'consent_expired',
                contractId: 'fan-contract',
            })
        ).resolves.toBe(false);
        expect(await isFlagged('event-again')).toBe(false);
    });

    it('sends request events to the owner and the requester only', async () => {
        await createIntegrationOnlyEvent({
            id: 'event-request',
            kind: 'request_sent',
            contractId: 'fan-contract',
            subjectProfileId: 'fan-veteran',
            requestId: 'request-2',
            requestedBy: 'fan-requester',
            externalReferenceId: 'case-10',
            occurredAt: OCCURRED_AT,
            domain: DOMAIN,
        });

        const summary = await fanOutIntegrationEvents();

        expect(summary).toEqual({ events: 1, records: 2 });
        expect(await recordsFor('int-writer')).toEqual([]);
        expect(await recordsFor('int-recipient')).toEqual([]);

        const [ownerRecord] = await recordsFor('int-owner');
        const [requesterRecord] = await recordsFor('int-requester');

        expect(ownerRecord?.type).toBe('request_sent');
        expect(ownerRecord?.subject?.profileId).toBe('fan-veteran');
        expect(ownerRecord?.externalReferenceId).toBe('case-10');
        expect(requesterRecord?.role).toBe('requester');
        expect(requesterRecord?.externalReferenceId).toBe('case-10');
    });

    it('adds a request_accepted record before the consent record when a request was accepted', async () => {
        await createIntegrationOnlyEvent({
            id: 'event-accept',
            kind: 'consent_created',
            contractId: 'fan-contract',
            termsId: 'fan-terms',
            requestId: 'request-3',
            requestedBy: 'fan-requester',
            externalReferenceId: 'case-11',
            occurredAt: OCCURRED_AT,
            domain: DOMAIN,
        });
        await run(
            "MATCH (event:ConsentFlowEvent {id: 'event-accept'}) SET event.requestAccepted = true"
        );

        const summary = await fanOutIntegrationEvents();

        // owner 2, requester 2, writer 1, recipient 1
        expect(summary).toEqual({ events: 1, records: 6 });

        const ownerRecords = await recordsFor('int-owner');

        expect(
            ownerRecords.map(record => [record.sequence, record.type, record.deliveryKey])
        ).toEqual([
            [1, 'request_accepted', 'event-accept:accepted:int-owner'],
            [2, 'consent_created', 'event-accept:int-owner'],
        ]);
        expect(ownerRecords[0]?.eventId).toBe('event-accept');
        expect(ownerRecords[0]).not.toHaveProperty('termsUri');
        expect(ownerRecords[0]?.subject?.profileId).toBe('fan-veteran');

        expect((await recordsFor('int-requester')).map(record => record.type)).toEqual([
            'request_accepted',
            'consent_created',
        ]);
        expect((await recordsFor('int-writer')).map(record => record.type)).toEqual([
            'consent_created',
        ]);
    });

    it('unflags events it cannot fan out and processes only the requested event', async () => {
        await run(
            `CREATE (:ConsentFlowEvent {id: 'event-internal', kind: 'contract_updated',
                 contractId: 'fan-contract', createdAt: $occurredAt, integrationFanoutPending: true})`,
            { occurredAt: OCCURRED_AT }
        );
        await createIntegrationOnlyEvent({
            id: 'event-other',
            kind: 'contract_retired',
            contractId: 'fan-contract',
            occurredAt: OCCURRED_AT,
            domain: DOMAIN,
        });

        const single = await fanOutIntegrationEvents({ eventId: 'event-internal' });

        expect(single).toEqual({ events: 1, records: 0 });
        expect(await isFlagged('event-internal')).toBe(false);
        expect(await isFlagged('event-other')).toBe(true);
    });

    it('hides the subject when the event is marked subjectHidden', async () => {
        await createIntegrationOnlyEvent({
            id: 'event-hidden',
            kind: 'request_sent',
            contractId: 'fan-contract',
            subjectProfileId: 'fan-veteran',
            requestedBy: 'fan-requester',
            occurredAt: OCCURRED_AT,
            domain: DOMAIN,
        });
        await run(
            "MATCH (event:ConsentFlowEvent {id: 'event-hidden'}) SET event.subjectHidden = true"
        );
        await fanOutIntegrationEvents();

        const [ownerRecord] = await recordsFor('int-owner');

        expect(ownerRecord?.type).toBe('request_sent');
        expect(ownerRecord).not.toHaveProperty('subject');
    });

    describe('failing events', () => {
        const POISON_PREFIX = 'poison-';

        /** Makes the audience lookup throw for events of contracts whose id starts with poison-. */
        const failPoisonContracts = (): { attempts: () => number } => {
            const original = neogma.queryRunner.run.bind(neogma.queryRunner);
            let count = 0;

            vi.spyOn(neogma.queryRunner, 'run').mockImplementation(((
                query: string,
                params?: Record<string, unknown>
            ) => {
                if (
                    query.includes('(contract:ConsentFlowContract {id: $contractId})') &&
                    String(params?.contractId).startsWith(POISON_PREFIX)
                ) {
                    count++;

                    return Promise.reject(new Error('audience failed'));
                }

                return original(query, params);
            }) as typeof neogma.queryRunner.run);

            return { attempts: (): number => count };
        };

        const eventState = async (eventId: string): Promise<Record<string, unknown>> => {
            const result = await run('MATCH (event:ConsentFlowEvent {id: $eventId}) RETURN event', {
                eventId,
            });

            return result.records[0]?.get('event').properties ?? {};
        };

        const makeDue = (eventId: string): Promise<unknown> =>
            run(
                `MATCH (event:ConsentFlowEvent {id: $eventId})
                 SET event.integrationFanoutNextAt = '2000-01-01T00:00:00.000Z'`,
                { eventId }
            );

        const createEvent = (
            id: string,
            contractId: string,
            occurredAt: string
        ): Promise<boolean> =>
            createIntegrationOnlyEvent({
                id,
                kind: 'contract_retired',
                contractId,
                occurredAt,
                domain: DOMAIN,
            });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('does not let more failing events than the batch limit block a newer healthy event', async () => {
            const spy = failPoisonContracts();

            await createEvent('bad-1', 'poison-1', '2026-02-01T00:00:00.000Z');
            await createEvent('bad-2', 'poison-2', '2026-02-01T00:00:01.000Z');
            await createEvent('bad-3', 'poison-3', '2026-02-01T00:00:02.000Z');
            await createEvent('good', 'fan-contract', '2026-02-02T00:00:00.000Z');

            const first = await fanOutIntegrationEvents({ limit: 2 });

            expect(first.events).toBe(0);
            expect(spy.attempts()).toBe(2);

            // The two failed events are backing off, so this pass reaches bad-3 and the healthy event.
            const second = await fanOutIntegrationEvents({ limit: 2 });

            expect(second.events).toBe(1);
            expect(await isFlagged('good')).toBe(false);
            expect(await isFlagged('bad-1')).toBe(true);
            expect(await isFlagged('bad-3')).toBe(true);
            expect(Number((await eventState('bad-1')).integrationFanoutAttempts)).toBe(1);
            expect(Number((await eventState('bad-3')).integrationFanoutAttempts)).toBe(1);
        });

        it('retries a failing event only after its backoff, which doubles up to one hour', async () => {
            const spy = failPoisonContracts();

            await createEvent('bad', 'poison-1', OCCURRED_AT);

            const before = Date.now();
            await fanOutIntegrationEvents();

            expect(spy.attempts()).toBe(1);

            const first = await eventState('bad');
            const firstDelay = Date.parse(String(first.integrationFanoutNextAt)) - before;

            expect(Number(first.integrationFanoutAttempts)).toBe(1);
            expect(firstDelay).toBeGreaterThanOrEqual(59_000);
            expect(firstDelay).toBeLessThanOrEqual(70_000);

            await fanOutIntegrationEvents();
            await fanOutIntegrationEvents({ eventId: 'bad' });
            expect(spy.attempts()).toBe(1);

            await makeDue('bad');
            const secondStart = Date.now();
            await fanOutIntegrationEvents();

            expect(spy.attempts()).toBe(2);

            const second = await eventState('bad');
            const secondDelay = Date.parse(String(second.integrationFanoutNextAt)) - secondStart;

            expect(Number(second.integrationFanoutAttempts)).toBe(2);
            expect(secondDelay).toBeGreaterThanOrEqual(119_000);
            expect(secondDelay).toBeLessThanOrEqual(130_000);

            await run(
                `MATCH (event:ConsentFlowEvent {id: 'bad'})
                 SET event.integrationFanoutAttempts = 10, event.integrationFanoutNextAt = '2000-01-01T00:00:00.000Z'`
            );
            const capStart = Date.now();
            await fanOutIntegrationEvents();

            const capped = await eventState('bad');
            const cappedDelay = Date.parse(String(capped.integrationFanoutNextAt)) - capStart;

            expect(cappedDelay).toBeGreaterThanOrEqual(3_599_000);
            expect(cappedDelay).toBeLessThanOrEqual(3_610_000);
        });

        it('abandons an event after the attempt limit and keeps the attempt count', async () => {
            const spy = failPoisonContracts();
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

            await createEvent('bad', 'poison-1', OCCURRED_AT);

            for (let attempt = 1; attempt <= MAX_FANOUT_ATTEMPTS; attempt++) {
                await fanOutIntegrationEvents();
                if (attempt < MAX_FANOUT_ATTEMPTS) {
                    expect(await isFlagged('bad')).toBe(true);
                    await makeDue('bad');
                }
            }

            expect(spy.attempts()).toBe(MAX_FANOUT_ATTEMPTS);
            expect(await isFlagged('bad')).toBe(false);

            const state = await eventState('bad');

            expect(Number(state.integrationFanoutAttempts)).toBe(MAX_FANOUT_ATTEMPTS);
            expect(typeof state.integrationFanoutFailedAt).toBe('string');
            expect(state.integrationFanoutNextAt).toBeUndefined();
            expect(warn).toHaveBeenCalledWith('integration_events: fanout_abandoned');

            await fanOutIntegrationEvents();
            expect(spy.attempts()).toBe(MAX_FANOUT_ATTEMPTS);
        });

        it('does not let a failing event block the inline path and clears attempts on success', async () => {
            const spy = failPoisonContracts();

            await createEvent('bad', 'poison-1', OCCURRED_AT);
            await createEvent('good', 'fan-contract', OCCURRED_AT);
            await run(
                `MATCH (event:ConsentFlowEvent {id: 'good'})
                 SET event.integrationFanoutAttempts = 3, event.integrationFanoutNextAt = '2000-01-01T00:00:00.000Z'`
            );
            await fanOutIntegrationEvents({ eventId: 'bad' });
            expect(spy.attempts()).toBe(1);

            // Not due yet: the inline path skips it.
            await expect(fanOutIntegrationEvents({ eventId: 'bad' })).resolves.toEqual({
                events: 0,
                records: 0,
            });
            expect(spy.attempts()).toBe(1);

            const summary = await fanOutIntegrationEvents({ eventId: 'good' });
            const state = await eventState('good');

            expect(summary.events).toBe(1);
            expect(state.integrationFanoutPending).toBeUndefined();
            expect(state.integrationFanoutAttempts).toBeUndefined();
            expect(state.integrationFanoutNextAt).toBeUndefined();
        });
    });
});
