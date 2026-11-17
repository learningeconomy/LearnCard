import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { neogma } from '@instance';
import { Integration, Profile } from '@models';
import * as notificationTransport from '@helpers/notification-webhook-fetch.helpers';
import {
    createIntegrationOnlyEvent,
    dispatchIntegrationWebhooks,
    fanOutIntegrationEvents,
    toIntegrationEvent,
} from '@helpers/integration-events.helpers';
import { signIntegrationWebhookBody } from '@helpers/integration-webhook-signature.helpers';

import { getUser } from './helpers/getClient';

let userA: Awaited<ReturnType<typeof getUser>>;

const WEBHOOK_URL = 'https://hooks.example.com/learncard';

const run = (query: string, params: Record<string, unknown> = {}) =>
    neogma.queryRunner.run(query, params);

const answer = (status: number) => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => '',
});

const stored = async (eventId: string): Promise<Record<string, unknown>> => {
    const result = await run('MATCH (record:IntegrationEvent {eventId: $eventId}) RETURN record', {
        eventId,
    });

    return result.records[0]?.get('record').properties ?? {};
};

/** Makes a pending record due now (a failed attempt schedules the next one in the future). */
const makeDue = async (eventId: string): Promise<void> => {
    await run(
        `MATCH (record:IntegrationEvent {eventId: $eventId})
         SET record.nextAttemptAt = '2020-01-01T00:00:00.000Z'`,
        { eventId }
    );
};

// The first hook also boots the wallet and the database connection, which can be slow.
vi.setConfig({ hookTimeout: 30_000 });

describe('dispatchIntegrationWebhooks', () => {
    let integrationId: string;
    let secret: string;
    /** The first secret, returned once when the webhook URL was registered. */
    let registrationSecret: string | undefined;
    let fetchSpy: ReturnType<
        typeof vi.spyOn<typeof notificationTransport, 'fetchNotificationWebhook'>
    >;

    const seedEvent = async (id: string): Promise<void> => {
        await createIntegrationOnlyEvent({
            id,
            kind: 'contract_retired',
            contractId: 'dispatch-contract',
        });
        await fanOutIntegrationEvents({ limit: 500 });
    };

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

        await userA.clients.fullAuth.profile.createProfile({ profileId: 'dispatch-usera' });
        integrationId = await userA.clients.fullAuth.integrations.addIntegration({
            name: 'Dispatch',
            whitelistedDomains: [],
        });
        registrationSecret = (
            await userA.clients.fullAuth.integrations.setIntegrationWebhook({
                id: integrationId,
                webhookUrl: WEBHOOK_URL,
            })
        ).secret;
        secret = (
            await userA.clients.fullAuth.integrations.rotateIntegrationWebhookSecret({
                id: integrationId,
            })
        ).secret;
        await run(
            `MATCH (owner:Profile {profileId: 'dispatch-usera'})
             CREATE (:ConsentFlowContract {id: 'dispatch-contract'})-[:CREATED_BY]->(owner)`
        );

        fetchSpy = vi
            .spyOn(notificationTransport, 'fetchNotificationWebhook')
            .mockResolvedValue(answer(200));
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => vi.restoreAllMocks());

    it('delivers a pending record with a signature the receiver can verify', async () => {
        await seedEvent('dispatch-1');

        await expect(dispatchIntegrationWebhooks()).resolves.toEqual({
            delivered: 1,
            pending: 0,
            rejected: 0,
            failed: 0,
        });
        expect(fetchSpy).toHaveBeenCalledOnce();

        const [destination, request] = fetchSpy.mock.calls[0]!;
        const record = await stored('dispatch-1');

        expect(destination).toBe(WEBHOOK_URL);
        // The body is exactly the feed record.
        expect(JSON.parse(request.body)).toEqual(toIntegrationEvent(record));
        expect(request.headers['X-LearnCard-Event-Id']).toBe('dispatch-1');
        expect(request.headers['X-LearnCard-Delivery']).toBe(`dispatch-1:${integrationId}`);

        // Current secret first; the secret created with the URL is still valid as the previous one.
        const parts = String(request.headers['X-LearnCard-Signature']).split(',');
        const timestamp = Number(parts[0]!.slice(2));

        expect(parts).toHaveLength(3);
        expect(parts[1]).toBe(
            `v1=${signIntegrationWebhookBody({ secret, timestamp, body: request.body })}`
        );
        expect(registrationSecret).toBeDefined();
        expect(parts[2]).toBe(
            `v1=${signIntegrationWebhookBody({
                secret: String(registrationSecret),
                timestamp,
                body: request.body,
            })}`
        );

        expect(record.deliveryState).toBe('delivered');
        expect(Number(record.attempts)).toBe(1);
        expect(Number(record.lastStatus)).toBe(200);
        expect(record.lease).toBeUndefined();
        expect(record.nextAttemptAt).toBeUndefined();

        // Nothing is sent twice.
        await expect(dispatchIntegrationWebhooks()).resolves.toMatchObject({ delivered: 0 });
        expect(fetchSpy).toHaveBeenCalledOnce();
    });

    it('retries a 500 later with backoff and keeps the record in the feed', async () => {
        await seedEvent('dispatch-2');
        fetchSpy.mockResolvedValue(answer(500));

        const before = Date.now();

        await expect(dispatchIntegrationWebhooks()).resolves.toEqual({
            delivered: 0,
            pending: 1,
            rejected: 0,
            failed: 0,
        });

        const afterFirst = await stored('dispatch-2');

        expect(afterFirst.deliveryState).toBe('pending');
        expect(afterFirst.failureReason).toBe('http_500');
        expect(Number(afterFirst.lastStatus)).toBe(500);
        expect(Number(afterFirst.attempts)).toBe(1);

        const delayMs = new Date(String(afterFirst.nextAttemptAt)).getTime() - before;
        expect(delayMs).toBeGreaterThanOrEqual(59_000);
        expect(delayMs).toBeLessThanOrEqual(70_000);

        // Not due yet, so a second pass sends nothing.
        await dispatchIntegrationWebhooks();
        expect(fetchSpy).toHaveBeenCalledOnce();

        // Second attempt succeeds.
        await makeDue('dispatch-2');
        fetchSpy.mockResolvedValue(answer(204));

        await expect(dispatchIntegrationWebhooks()).resolves.toMatchObject({ delivered: 1 });

        const afterSecond = await stored('dispatch-2');

        expect(afterSecond.deliveryState).toBe('delivered');
        expect(Number(afterSecond.attempts)).toBe(2);

        const feed = await userA.clients.fullAuth.integrations.getIntegrationEvents({
            id: integrationId,
        });
        expect(feed.records.map(item => item.eventId)).toEqual(['dispatch-2']);
    });

    it('treats a 4xx other than 408, 425 and 429 as final', async () => {
        await seedEvent('dispatch-3');
        fetchSpy.mockResolvedValue(answer(404));

        await expect(dispatchIntegrationWebhooks()).resolves.toEqual({
            delivered: 0,
            pending: 0,
            rejected: 1,
            failed: 0,
        });

        const record = await stored('dispatch-3');

        expect(record.deliveryState).toBe('rejected');
        expect(record.failureReason).toBe('http_404');
        expect(record.nextAttemptAt).toBeUndefined();

        const feed = await userA.clients.fullAuth.integrations.getIntegrationEvents({
            id: integrationId,
        });
        expect(feed.records).toHaveLength(1);
    });

    it('keeps retrying a 429', async () => {
        await seedEvent('dispatch-4');
        fetchSpy.mockResolvedValue(answer(429));

        await expect(dispatchIntegrationWebhooks()).resolves.toMatchObject({ pending: 1 });
        expect((await stored('dispatch-4')).deliveryState).toBe('pending');
    });

    it('gives up after 12 attempts', async () => {
        await seedEvent('dispatch-5');
        fetchSpy.mockResolvedValue(answer(503));
        await run(
            "MATCH (record:IntegrationEvent {eventId: 'dispatch-5'}) SET record.attempts = 11"
        );

        await expect(dispatchIntegrationWebhooks()).resolves.toEqual({
            delivered: 0,
            pending: 0,
            rejected: 0,
            failed: 1,
        });

        const record = await stored('dispatch-5');

        expect(record.deliveryState).toBe('failed');
        expect(Number(record.attempts)).toBe(12);
        expect(fetchSpy).toHaveBeenCalledOnce();
    });

    it('gives up without sending once the record is older than 24 hours', async () => {
        await seedEvent('dispatch-6');
        await run(
            `MATCH (record:IntegrationEvent {eventId: 'dispatch-6'})
             SET record.createdAt = '2020-01-01T00:00:00.000Z'`
        );

        await expect(dispatchIntegrationWebhooks()).resolves.toMatchObject({ failed: 1 });
        expect((await stored('dispatch-6')).failureReason).toBe('retry_expired');
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('rejects a record whose integration no longer has a webhook URL', async () => {
        await seedEvent('dispatch-7');
        await userA.clients.fullAuth.integrations.setIntegrationWebhook({
            id: integrationId,
            webhookUrl: null,
        });

        await expect(dispatchIntegrationWebhooks()).resolves.toMatchObject({ rejected: 1 });
        expect((await stored('dispatch-7')).failureReason).toBe('no_webhook');
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('rejects pending and retrying records once contract events are disabled', async () => {
        await seedEvent('dispatch-disabled-pending');
        await seedEvent('dispatch-disabled-retrying');
        await run(
            `MATCH (record:IntegrationEvent {eventId: 'dispatch-disabled-retrying'})
             SET record.attempts = 3, record.failureReason = 'http_500'`
        );

        await userA.clients.fullAuth.integrations.updateIntegration({
            id: integrationId,
            updates: { contractEventsEnabled: false },
        });

        await expect(dispatchIntegrationWebhooks()).resolves.toEqual({
            delivered: 0,
            pending: 0,
            rejected: 2,
            failed: 0,
        });
        expect(fetchSpy).not.toHaveBeenCalled();

        for (const eventId of ['dispatch-disabled-pending', 'dispatch-disabled-retrying']) {
            const record = await stored(eventId);

            expect(record.deliveryState).toBe('rejected');
            expect(record.failureReason).toBe('disabled');
            expect(record.nextAttemptAt).toBeUndefined();
        }

        // The records stay in the feed.
        const feed = await userA.clients.fullAuth.integrations.getIntegrationEvents({
            id: integrationId,
        });

        expect(feed.records.map(record => record.eventId).sort()).toEqual([
            'dispatch-disabled-pending',
            'dispatch-disabled-retrying',
        ]);

        // Final: a later pass does not pick them up again.
        await expect(dispatchIntegrationWebhooks()).resolves.toMatchObject({ rejected: 0 });
    });

    it('does not deliver records from before a disable after events are enabled again', async () => {
        await seedEvent('dispatch-before-disable');

        await userA.clients.fullAuth.integrations.updateIntegration({
            id: integrationId,
            updates: { contractEventsEnabled: false },
        });
        await new Promise(resolve => setTimeout(resolve, 5));
        await userA.clients.fullAuth.integrations.updateIntegration({
            id: integrationId,
            updates: { contractEventsEnabled: true },
        });
        await new Promise(resolve => setTimeout(resolve, 5));
        await seedEvent('dispatch-after-enable');

        await expect(dispatchIntegrationWebhooks()).resolves.toEqual({
            delivered: 1,
            pending: 0,
            rejected: 1,
            failed: 0,
        });
        expect(fetchSpy).toHaveBeenCalledOnce();
        expect(JSON.parse(fetchSpy.mock.calls[0]![1].body).eventId).toBe('dispatch-after-enable');
        expect((await stored('dispatch-before-disable')).failureReason).toBe('disabled');
    });

    it('does not send a record that another worker holds a lease on', async () => {
        await seedEvent('dispatch-8');
        await run(
            `MATCH (record:IntegrationEvent {eventId: 'dispatch-8'})
             SET record.lease = 'other-worker', record.leaseUntil = $future`,
            { future: new Date(Date.now() + 60_000).toISOString() }
        );

        await expect(dispatchIntegrationWebhooks()).resolves.toMatchObject({ delivered: 0 });
        expect(fetchSpy).not.toHaveBeenCalled();

        // An abandoned lease is taken over once it has expired.
        await run(
            `MATCH (record:IntegrationEvent {eventId: 'dispatch-8'})
             SET record.leaseUntil = '2020-01-01T00:00:00.000Z'`
        );

        await expect(dispatchIntegrationWebhooks()).resolves.toMatchObject({ delivered: 1 });
    });

    it('never sends records of an integration without a webhook', async () => {
        await userA.clients.fullAuth.integrations.setIntegrationWebhook({
            id: integrationId,
            webhookUrl: null,
        });
        await seedEvent('dispatch-9');

        expect((await stored('dispatch-9')).deliveryState).toBe('none');
        await expect(dispatchIntegrationWebhooks()).resolves.toEqual({
            delivered: 0,
            pending: 0,
            rejected: 0,
            failed: 0,
        });
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('logs only fixed strings', async () => {
        await seedEvent('dispatch-10');
        fetchSpy.mockResolvedValue(answer(500));

        await dispatchIntegrationWebhooks();

        const logged = JSON.stringify(vi.mocked(console.warn).mock.calls);

        expect(logged).toContain('integration_events: delivery_pending');
        expect(logged).not.toContain('hooks.example.com');
        expect(logged).not.toContain('whsec');
        expect(logged).not.toContain('dispatch-usera');
    });

    it('gives every integration a share of a pass and caps what one integration can take', async () => {
        const otherId = await userA.clients.fullAuth.integrations.addIntegration({
            name: 'Other',
            whitelistedDomains: [],
        });

        await userA.clients.fullAuth.integrations.setIntegrationWebhook({
            id: otherId,
            webhookUrl: 'https://other.example.com/learncard',
        });

        // Both integrations belong to the contract owner, so every event reaches both.
        for (let index = 0; index < 20; index++) {
            await createIntegrationOnlyEvent({
                id: `fair-${String(index).padStart(2, '0')}`,
                kind: 'contract_retired',
                contractId: 'dispatch-contract',
            });
        }
        await fanOutIntegrationEvents({ limit: 500 });
        await run(
            `MATCH (record:IntegrationEvent {integrationId: $otherId})
             WHERE record.eventId >= 'fair-02' DETACH DELETE record`,
            { otherId }
        );
        // The slow integration's backlog is older, so a plain oldest-first read would fill the batch.
        await run(
            `MATCH (record:IntegrationEvent {integrationId: $integrationId})
             SET record.nextAttemptAt = '2020-01-01T00:00:00.000Z'`,
            { integrationId }
        );
        await run(
            `MATCH (record:IntegrationEvent {integrationId: $otherId})
             SET record.nextAttemptAt = '2021-01-01T00:00:00.000Z'`,
            { otherId }
        );
        fetchSpy.mockImplementation(async destination => {
            if (destination === WEBHOOK_URL) await new Promise(resolve => setTimeout(resolve, 20));

            return answer(200);
        });

        const summary = await dispatchIntegrationWebhooks({ limit: 6 });
        const order = fetchSpy.mock.calls.map(([destination]) =>
            destination === WEBHOOK_URL ? 'slow' : 'other'
        );

        // Round-robin: each integration gets its first record before any gets its second.
        expect(summary.delivered).toBe(6);
        expect(order.slice(0, 4)).toEqual(['slow', 'other', 'slow', 'other']);
        expect(order.filter(name => name === 'other')).toHaveLength(2);

        fetchSpy.mockClear();

        // With a large limit one integration still gets at most 5 records in a pass.
        await dispatchIntegrationWebhooks({ limit: 100 });
        expect(fetchSpy).toHaveBeenCalledTimes(5);
        expect(fetchSpy.mock.calls.every(([destination]) => destination === WEBHOOK_URL)).toBe(
            true
        );
    });
});
