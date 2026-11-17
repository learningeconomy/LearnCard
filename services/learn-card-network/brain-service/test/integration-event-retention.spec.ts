import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { neogma } from '@instance';
import { Integration, Profile } from '@models';
import {
    createIntegrationOnlyEvent,
    encodeIntegrationEventCursor,
    fanOutIntegrationEvents,
    purgeExpiredIntegrationEvents,
} from '@helpers/integration-events.helpers';

import { readIntegrationEventPage } from '@accesslayer/integration-event/read';

import { getUser } from './helpers/getClient';

let userA: Awaited<ReturnType<typeof getUser>>;

const run = (query: string, params: Record<string, unknown> = {}) =>
    neogma.queryRunner.run(query, params);

const PAST = '2020-01-01T00:00:00.000Z';

const remainingSequences = async (integrationId: string): Promise<number[]> => {
    const result = await run(
        `MATCH (record:IntegrationEvent {integrationId: $integrationId})
         RETURN record.sequence AS sequence ORDER BY record.sequence`,
        { integrationId }
    );

    return result.records.map(row => Number(row.get('sequence')));
};

const purgedThrough = async (integrationId: string): Promise<number> => {
    const result = await run(
        `MATCH (integration:Integration {id: $integrationId})
         RETURN coalesce(integration.eventPurgedThroughSeq, 0) AS purged`,
        { integrationId }
    );

    return Number(result.records[0]?.get('purged'));
};

/** Makes the records with sequence <= throughSequence look older than the retention window. */
const expireThrough = async (integrationId: string, throughSequence: number): Promise<void> => {
    await run(
        `MATCH (record:IntegrationEvent {integrationId: $integrationId})
         WHERE record.sequence <= $throughSequence
         SET record.purgeAt = $past`,
        { integrationId, throughSequence, past: PAST }
    );
};

// The first hook also boots the wallet and the database connection, which can be slow.
vi.setConfig({ hookTimeout: 30_000 });

describe('purgeExpiredIntegrationEvents', () => {
    let integrationId: string;

    beforeAll(async () => {
        userA = await getUser('a'.repeat(64));
    });

    beforeEach(async () => {
        await run(
            `MATCH (n) WHERE n:IntegrationEvent OR n:ConsentFlowEvent OR n:ConsentFlowContract
             DETACH DELETE n`
        );
        await Integration.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({ profileId: 'retention-usera' });
        integrationId = await userA.clients.fullAuth.integrations.addIntegration({
            name: 'Retention',
            whitelistedDomains: [],
        });
        await userA.clients.fullAuth.integrations.updateIntegration({
            id: integrationId,
            updates: { contractEventsEnabled: true },
        });
        await run(
            `MATCH (owner:Profile {profileId: 'retention-usera'})
             CREATE (:ConsentFlowContract {id: 'retention-contract'})-[:CREATED_BY]->(owner)`
        );

        for (let index = 1; index <= 5; index++) {
            await createIntegrationOnlyEvent({
                id: `retention-event-${index}`,
                kind: 'contract_retired',
                contractId: 'retention-contract',
                occurredAt: new Date(Date.now() + index).toISOString(),
            });
        }
        await fanOutIntegrationEvents({ limit: 500 });
    });

    it('deletes nothing while every record is inside the retention window', async () => {
        await expect(purgeExpiredIntegrationEvents()).resolves.toEqual({ deleted: 0 });
        expect(await remainingSequences(integrationId)).toEqual([1, 2, 3, 4, 5]);
        expect(await purgedThrough(integrationId)).toBe(0);
    });

    it('deletes expired records in batches and records how far it purged', async () => {
        await expireThrough(integrationId, 3);

        // limit 2 forces two batches: 2 records, then 1.
        await expect(purgeExpiredIntegrationEvents({ limit: 2 })).resolves.toEqual({ deleted: 3 });

        expect(await remainingSequences(integrationId)).toEqual([4, 5]);
        expect(await purgedThrough(integrationId)).toBe(3);

        await expect(purgeExpiredIntegrationEvents({ limit: 2 })).resolves.toEqual({ deleted: 0 });
        expect(await purgedThrough(integrationId)).toBe(3);
    });

    it('makes the feed reject an older cursor and start at the oldest retained record', async () => {
        await expireThrough(integrationId, 3);
        await purgeExpiredIntegrationEvents();

        await expect(
            userA.clients.fullAuth.integrations.getIntegrationEvents({
                id: integrationId,
                since: encodeIntegrationEventCursor(1),
            })
        ).rejects.toMatchObject({
            code: 'CONFLICT',
            message: expect.stringMatching(/^CURSOR_EXPIRED: /),
        });

        const fromStart = await userA.clients.fullAuth.integrations.getIntegrationEvents({
            id: integrationId,
        });

        expect(fromStart.records.map(record => record.sequence)).toEqual([4, 5]);
        expect(fromStart.latestCursor).toBe(encodeIntegrationEventCursor(5));

        const fromBoundary = await userA.clients.fullAuth.integrations.getIntegrationEvents({
            id: integrationId,
            since: encodeIntegrationEventCursor(3),
        });

        expect(fromBoundary.records.map(record => record.sequence)).toEqual([4, 5]);
    });

    it('rejects a cursor that retention overtakes while the feed is being read', async () => {
        await expireThrough(integrationId, 3);

        // Retention runs at the worst moment: right before the page of records is read.
        const original = neogma.queryRunner.run.bind(neogma.queryRunner);
        let interleaved = false;
        const spy = vi
            .spyOn(neogma.queryRunner, 'run')
            .mockImplementation(async (...args: Parameters<typeof original>) => {
                if (!interleaved && args[0].includes('record.sequence > $afterSequence')) {
                    interleaved = true;
                    await purgeExpiredIntegrationEvents();
                }

                return original(...args);
            });

        try {
            await expect(
                userA.clients.fullAuth.integrations.getIntegrationEvents({
                    id: integrationId,
                    since: encodeIntegrationEventCursor(1),
                })
            ).rejects.toMatchObject({
                code: 'CONFLICT',
                message: expect.stringMatching(/^CURSOR_EXPIRED: /),
            });
            expect(interleaved).toBe(true);
        } finally {
            spy.mockRestore();
        }
    });

    it('waits for a purge that is in progress instead of reading around it', async () => {
        const session = neogma.driver.session();
        const transaction = session.beginTransaction();

        try {
            // An uncommitted purge of sequences 1 to 3: watermark first, then the records.
            await transaction.run(
                `MATCH (integration:Integration {id: $integrationId})
                 SET integration.eventPurgedThroughSeq = 3
                 WITH integration
                 MATCH (record:IntegrationEvent {integrationId: $integrationId})
                 WHERE record.sequence <= 3
                 DETACH DELETE record`,
                { integrationId }
            );

            let settled = false;
            const read = userA.clients.fullAuth.integrations
                .getIntegrationEvents({ id: integrationId, since: encodeIntegrationEventCursor(1) })
                .then(
                    () => 'returned',
                    (error: { message?: string }) => error.message ?? 'failed'
                )
                .finally(() => {
                    settled = true;
                });

            await new Promise(resolve => setTimeout(resolve, 750));
            expect(settled).toBe(false);

            await transaction.commit();

            await expect(read).resolves.toMatch(/^CURSOR_EXPIRED: /);
        } finally {
            if (transaction.isOpen()) await transaction.rollback();
            await session.close();
        }
    });

    it('reads the sequence state and the page in one statement', async () => {
        await expireThrough(integrationId, 3);
        await purgeExpiredIntegrationEvents();

        const page = await readIntegrationEventPage({
            integrationId,
            afterSequence: 3,
            limit: 10,
        });

        expect(page?.eventSeq).toBe(5);
        expect(page?.eventPurgedThroughSeq).toBe(3);
        expect(page?.records.map(record => record.sequence)).toEqual([4, 5]);

        const limited = await readIntegrationEventPage({
            integrationId,
            afterSequence: 0,
            limit: 1,
        });

        expect(limited?.records.map(record => record.sequence)).toEqual([4]);

        const empty = await readIntegrationEventPage({
            integrationId,
            afterSequence: 5,
            limit: 10,
        });

        expect(empty).toEqual({ eventSeq: 5, eventPurgedThroughSeq: 3, records: [] });

        await expect(
            readIntegrationEventPage({ integrationId: 'missing', afterSequence: 0, limit: 10 })
        ).resolves.toBeNull();
    });

    it('uses the retention window of 30 days from the given time', async () => {
        const in29Days = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000);
        const in31Days = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);

        await expect(purgeExpiredIntegrationEvents({ now: in29Days })).resolves.toEqual({
            deleted: 0,
        });
        await expect(purgeExpiredIntegrationEvents({ now: in31Days })).resolves.toEqual({
            deleted: 5,
        });

        expect(await remainingSequences(integrationId)).toEqual([]);
        expect(await purgedThrough(integrationId)).toBe(5);

        // New events keep counting from the old sequence.
        await createIntegrationOnlyEvent({
            id: 'retention-event-6',
            kind: 'contract_retired',
            contractId: 'retention-contract',
        });
        await fanOutIntegrationEvents();

        expect(await remainingSequences(integrationId)).toEqual([6]);
    });

    it('deletes expired records of an integration that no longer exists', async () => {
        await expireThrough(integrationId, 5);
        await Integration.delete({ detach: true, where: { id: integrationId } });

        await expect(purgeExpiredIntegrationEvents()).resolves.toEqual({ deleted: 5 });
        expect(await remainingSequences(integrationId)).toEqual([]);
    });
});
