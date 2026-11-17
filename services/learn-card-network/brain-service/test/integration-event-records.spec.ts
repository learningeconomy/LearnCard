import { beforeEach, describe, expect, it, vi } from 'vitest';

import { neogma } from '@instance';
import { ensureContractEventMaintenance } from '@helpers/contract-event-maintenance.helpers';
import {
    createIntegrationOnlyEvent,
    decodeIntegrationEventCursor,
    encodeIntegrationEventCursor,
    toIntegrationEvent,
} from '@helpers/integration-events.helpers';

const run = (query: string, params: Record<string, unknown> = {}) =>
    neogma.queryRunner.run(query, params);

const readEvent = async (id: string): Promise<Record<string, unknown> | undefined> => {
    const result = await run('MATCH (event:ConsentFlowEvent {id: $id}) RETURN event', { id });

    return result.records[0]?.get('event').properties;
};

// The first hook also boots the wallet and the database connection, which can be slow.
vi.setConfig({ hookTimeout: 30_000 });

describe('integration event schema', () => {
    it('creates the IntegrationEvent constraint and the four indexes', async () => {
        await ensureContractEventMaintenance();

        const indexes = await run('SHOW INDEXES YIELD name RETURN collect(name) AS names');
        const constraints = await run('SHOW CONSTRAINTS YIELD name RETURN collect(name) AS names');

        expect(indexes.records[0]?.get('names')).toEqual(
            expect.arrayContaining([
                'consent_event_integration_fanout',
                'integration_event_feed',
                'integration_event_due',
                'integration_event_purge',
            ])
        );
        expect(constraints.records[0]?.get('names')).toEqual(
            expect.arrayContaining(['integration_event_id'])
        );
    });
});

describe('createIntegrationOnlyEvent', () => {
    beforeEach(async () => {
        await run(
            "MATCH (event:ConsentFlowEvent) WHERE event.id STARTS WITH 'only-' DETACH DELETE event"
        );
    });

    it('creates a flagged event with no deliveries', async () => {
        await expect(
            createIntegrationOnlyEvent({
                id: 'only-1',
                kind: 'consent_expired',
                contractId: 'contract-1',
                termsId: 'terms-1',
                subjectProfileId: 'veteran',
                requestId: 'request-1',
                requestedBy: 'referrer',
                externalReferenceId: 'case-9',
                reason: 'terms_expired',
                occurredAt: '2026-02-01T00:00:00.000Z',
                domain: 'example.com',
            })
        ).resolves.toBe(true);

        expect(await readEvent('only-1')).toEqual({
            id: 'only-1',
            kind: 'consent_expired',
            contractId: 'contract-1',
            termsId: 'terms-1',
            targetId: 'veteran',
            requestId: 'request-1',
            requestedBy: 'referrer',
            externalReferenceId: 'case-9',
            reason: 'terms_expired',
            createdAt: '2026-02-01T00:00:00.000Z',
            domain: 'example.com',
            integrationFanoutPending: true,
        });

        const deliveries = await run(
            "MATCH (:ConsentFlowEvent {id: 'only-1'})-[:HAS_DELIVERY]->(delivery) RETURN count(delivery) AS total"
        );
        expect(Number(deliveries.records[0]?.get('total'))).toBe(0);
    });

    it('fills in the time and the domain, and leaves optional properties out', async () => {
        const before = Date.now();

        await createIntegrationOnlyEvent({
            id: 'only-2',
            kind: 'contract_retired',
            contractId: 'contract-1',
        });

        const event = await readEvent('only-2');

        expect(Object.keys(event ?? {}).sort()).toEqual([
            'contractId',
            'createdAt',
            'domain',
            'id',
            'integrationFanoutPending',
            'kind',
        ]);
        expect(new Date(String(event?.createdAt)).getTime()).toBeGreaterThanOrEqual(before);
        expect(typeof event?.domain).toBe('string');
    });

    it('does nothing the second time for the same id', async () => {
        await createIntegrationOnlyEvent({
            id: 'only-3',
            kind: 'consent_suspended',
            contractId: 'contract-1',
            occurredAt: '2026-02-01T00:00:00.000Z',
        });
        await run(
            "MATCH (event:ConsentFlowEvent {id: 'only-3'}) REMOVE event.integrationFanoutPending"
        );

        await expect(
            createIntegrationOnlyEvent({
                id: 'only-3',
                kind: 'consent_suspended',
                contractId: 'contract-2',
                occurredAt: '2026-03-01T00:00:00.000Z',
            })
        ).resolves.toBe(false);

        const event = await readEvent('only-3');

        expect(event?.contractId).toBe('contract-1');
        expect(event?.createdAt).toBe('2026-02-01T00:00:00.000Z');
        expect(event).not.toHaveProperty('integrationFanoutPending');
        expect(event).not.toHaveProperty('createdNow');
    });
});

describe('toIntegrationEvent', () => {
    const stored = {
        id: 'event-1:integration-1',
        integrationId: 'integration-1',
        eventId: 'event-1',
        sequence: 7,
        type: 'consent_created',
        contractUri: 'lc:network:example.com/trpc:contract:abc',
        termsUri: 'lc:network:example.com/trpc:terms:def',
        subjectProfileId: 'veteran',
        subjectDid: 'did:web:example.com:users:veteran',
        subjectDidKey: 'did:key:z6Mk',
        requestId: 'request-1',
        externalReferenceId: 'case-9',
        reason: 'contract_retired',
        role: 'recipient',
        occurredAt: '2026-02-01T00:00:00.000Z',
        createdAt: '2026-02-01T00:00:01.000Z',
        purgeAt: '2026-03-03T00:00:01.000Z',
        deliveryState: 'pending',
        attempts: 0,
        nextAttemptAt: '2026-02-01T00:00:01.000Z',
    };

    it('maps stored properties to the public record and drops bookkeeping', () => {
        expect(toIntegrationEvent(stored)).toEqual({
            eventId: 'event-1',
            deliveryKey: 'event-1:integration-1',
            sequence: 7,
            type: 'consent_created',
            contractUri: 'lc:network:example.com/trpc:contract:abc',
            termsUri: 'lc:network:example.com/trpc:terms:def',
            subject: {
                profileId: 'veteran',
                did: 'did:web:example.com:users:veteran',
                didKey: 'did:key:z6Mk',
            },
            requestId: 'request-1',
            externalReferenceId: 'case-9',
            reason: 'contract_retired',
            role: 'recipient',
            occurredAt: '2026-02-01T00:00:00.000Z',
        });
    });

    it('omits optional fields that are not stored', () => {
        const record = toIntegrationEvent({
            id: 'event-2:integration-1',
            eventId: 'event-2',
            sequence: 1,
            type: 'contract_retired',
            contractUri: 'lc:network:example.com/trpc:contract:abc',
            role: 'owner',
            occurredAt: '2026-02-01T00:00:00.000Z',
        });

        expect(Object.keys(record)).toEqual([
            'eventId',
            'deliveryKey',
            'sequence',
            'type',
            'contractUri',
            'role',
            'occurredAt',
        ]);
    });

    it('converts a Neo4j Integer sequence to a number', () => {
        expect(toIntegrationEvent({ ...stored, sequence: { toNumber: () => 9 } }).sequence).toBe(9);
    });

    it('throws for a record with an unknown type', () => {
        expect(() => toIntegrationEvent({ ...stored, type: 'contract_updated' })).toThrow();
    });

    it('re-exports the cursor codec', () => {
        expect(
            decodeIntegrationEventCursor(encodeIntegrationEventCursor('int-1', 5), 'int-1')
        ).toBe(5);
    });
});
