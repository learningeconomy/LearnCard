import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { neogma } from '@instance';
import { Integration, Profile } from '@models';
import {
    createIntegrationOnlyEvent,
    encodeIntegrationEventCursor,
    fanOutIntegrationEvents,
} from '@helpers/integration-events.helpers';

import { getUser } from './helpers/getClient';

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let noFeedScopeA: Awaited<ReturnType<typeof getUser>>;

const run = (query: string, params: Record<string, unknown> = {}) =>
    neogma.queryRunner.run(query, params);

/** Creates `count` feed records for the integrations of profile `feed-usera`. */
const seedEvents = async (count: number, prefix = 'feed-event'): Promise<void> => {
    for (let index = 1; index <= count; index++) {
        await createIntegrationOnlyEvent({
            id: `${prefix}-${index}`,
            kind: 'contract_retired',
            contractId: 'feed-contract',
            occurredAt: new Date(Date.now() + index).toISOString(),
        });
    }

    await fanOutIntegrationEvents({ limit: 500 });
};

// The first hook also boots the wallet and the database connection, which can be slow.
vi.setConfig({ hookTimeout: 30_000 });

describe('getIntegrationEvents', () => {
    let integrationId: string;

    beforeAll(async () => {
        userA = await getUser('a'.repeat(64));
        userB = await getUser('b'.repeat(64));
        noFeedScopeA = await getUser('a'.repeat(64), 'contracts:read');
    });

    beforeEach(async () => {
        await run(
            `MATCH (n) WHERE n:IntegrationEvent OR n:ConsentFlowEvent OR n:ConsentFlowContract
             DETACH DELETE n`
        );
        await Integration.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({ profileId: 'feed-usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'feed-userb' });

        integrationId = await userA.clients.fullAuth.integrations.addIntegration({
            name: 'Feed',
            whitelistedDomains: [],
        });
        await userA.clients.fullAuth.integrations.updateIntegration({
            id: integrationId,
            updates: { contractEventsEnabled: true },
        });
        await run(
            `MATCH (owner:Profile {profileId: 'feed-usera'})
             CREATE (:ConsentFlowContract {id: 'feed-contract'})-[:CREATED_BY]->(owner)`
        );
    });

    it('returns an empty feed with latestCursor 0 and no cursor', async () => {
        const page = await userA.clients.fullAuth.integrations.getIntegrationEvents({
            id: integrationId,
        });

        expect(page).toEqual({
            records: [],
            latestCursor: encodeIntegrationEventCursor(integrationId, 0),
            hasMore: false,
        });
    });

    it('returns all records in sequence order from the start', async () => {
        await seedEvents(5);

        const page = await userA.clients.fullAuth.integrations.getIntegrationEvents({
            id: integrationId,
        });

        expect(page.records.map(record => record.sequence)).toEqual([1, 2, 3, 4, 5]);
        expect(page.records.map(record => record.eventId)).toEqual([
            'feed-event-1',
            'feed-event-2',
            'feed-event-3',
            'feed-event-4',
            'feed-event-5',
        ]);
        expect(page.records[0]).toMatchObject({
            deliveryKey: `feed-event-1:${integrationId}`,
            type: 'contract_retired',
            role: 'owner',
        });
        expect(page.hasMore).toBe(false);
        expect(page.cursor).toBe(encodeIntegrationEventCursor(integrationId, 5));
        expect(page.latestCursor).toBe(encodeIntegrationEventCursor(integrationId, 5));
    });

    it('pages with limit and since', async () => {
        await seedEvents(5);

        const first = await userA.clients.fullAuth.integrations.getIntegrationEvents({
            id: integrationId,
            limit: 2,
        });

        expect(first.records.map(record => record.sequence)).toEqual([1, 2]);
        expect(first.hasMore).toBe(true);
        expect(first.cursor).toBe(encodeIntegrationEventCursor(integrationId, 2));
        expect(first.latestCursor).toBe(encodeIntegrationEventCursor(integrationId, 5));

        const second = await userA.clients.fullAuth.integrations.getIntegrationEvents({
            id: integrationId,
            limit: 2,
            since: first.cursor,
        });

        expect(second.records.map(record => record.sequence)).toEqual([3, 4]);
        expect(second.hasMore).toBe(true);

        const third = await userA.clients.fullAuth.integrations.getIntegrationEvents({
            id: integrationId,
            limit: 2,
            since: second.cursor,
        });

        expect(third.records.map(record => record.sequence)).toEqual([5]);
        expect(third.hasMore).toBe(false);
        expect(third.cursor).toBe(encodeIntegrationEventCursor(integrationId, 5));
    });

    it('returns the same cursor back when there is nothing new', async () => {
        await seedEvents(2);

        const since = encodeIntegrationEventCursor(integrationId, 2);
        const page = await userA.clients.fullAuth.integrations.getIntegrationEvents({
            id: integrationId,
            since,
        });

        expect(page).toEqual({
            records: [],
            cursor: since,
            latestCursor: since,
            hasMore: false,
        });
    });

    it('rejects a cursor it did not issue and a limit out of range', async () => {
        await expect(
            userA.clients.fullAuth.integrations.getIntegrationEvents({
                id: integrationId,
                since: 'not-a-cursor',
            })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'Invalid cursor' });

        await expect(
            userA.clients.fullAuth.integrations.getIntegrationEvents({
                id: integrationId,
                limit: 0,
            })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

        await expect(
            userA.clients.fullAuth.integrations.getIntegrationEvents({
                id: integrationId,
                limit: 201,
            })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('round-trips latestCursor as since', async () => {
        await seedEvents(3);

        const first = await userA.clients.fullAuth.integrations.getIntegrationEvents({
            id: integrationId,
        });

        await seedEvents(2, 'feed-later');

        const next = await userA.clients.fullAuth.integrations.getIntegrationEvents({
            id: integrationId,
            since: first.latestCursor,
        });

        expect(next.records.map(record => record.sequence)).toEqual([4, 5]);
        expect(next.latestCursor).toBe(encodeIntegrationEventCursor(integrationId, 5));
    });

    it('rejects a cursor issued for another integration', async () => {
        await seedEvents(2);

        const otherId = await userA.clients.fullAuth.integrations.addIntegration({
            name: 'Other',
            whitelistedDomains: [],
        });

        await expect(
            userA.clients.fullAuth.integrations.getIntegrationEvents({
                id: integrationId,
                since: encodeIntegrationEventCursor(otherId, 1),
            })
        ).rejects.toMatchObject({
            code: 'BAD_REQUEST',
            message: expect.stringMatching(/different integration/),
        });
    });

    it('rejects a cursor that is ahead of the feed', async () => {
        await seedEvents(2);

        await expect(
            userA.clients.fullAuth.integrations.getIntegrationEvents({
                id: integrationId,
                since: encodeIntegrationEventCursor(integrationId, 3),
            })
        ).rejects.toMatchObject({
            code: 'BAD_REQUEST',
            message: expect.stringMatching(/ahead of this integration's feed/),
        });

        // The newest position itself is fine.
        await expect(
            userA.clients.fullAuth.integrations.getIntegrationEvents({
                id: integrationId,
                since: encodeIntegrationEventCursor(integrationId, 2),
            })
        ).resolves.toMatchObject({ records: [], hasMore: false });
    });

    it('rejects a cursor older than the purged range with CURSOR_EXPIRED', async () => {
        await seedEvents(5);
        await run(
            'MATCH (integration:Integration {id: $integrationId}) SET integration.eventPurgedThroughSeq = 3',
            { integrationId }
        );

        await expect(
            userA.clients.fullAuth.integrations.getIntegrationEvents({
                id: integrationId,
                since: encodeIntegrationEventCursor(integrationId, 2),
            })
        ).rejects.toMatchObject({
            code: 'CONFLICT',
            message: expect.stringMatching(/^CURSOR_EXPIRED: /),
        });

        // A cursor exactly at the purged boundary has lost nothing.
        const page = await userA.clients.fullAuth.integrations.getIntegrationEvents({
            id: integrationId,
            since: encodeIntegrationEventCursor(integrationId, 3),
        });

        expect(page.records.map(record => record.sequence)).toEqual([4, 5]);

        // With no cursor the feed starts at the oldest record that still exists.
        await expect(
            userA.clients.fullAuth.integrations.getIntegrationEvents({ id: integrationId })
        ).resolves.toMatchObject({ hasMore: false });
    });

    it('is refused for another profile and without the integrations:read scope', async () => {
        await expect(
            userB.clients.fullAuth.integrations.getIntegrationEvents({ id: integrationId })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

        await expect(
            noFeedScopeA.clients.fullAuth.integrations.getIntegrationEvents({ id: integrationId })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('never returns delivery bookkeeping', async () => {
        await seedEvents(1);

        const page = await userA.clients.fullAuth.integrations.getIntegrationEvents({
            id: integrationId,
        });

        expect(Object.keys(page.records[0] ?? {}).sort()).toEqual([
            'contractUri',
            'deliveryKey',
            'eventId',
            'occurredAt',
            'role',
            'sequence',
            'type',
        ]);
    });
});
