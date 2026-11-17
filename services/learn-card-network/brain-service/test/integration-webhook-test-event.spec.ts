import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { neogma } from '@instance';
import { Integration, Profile } from '@models';
import * as notificationTransport from '@helpers/notification-webhook-fetch.helpers';
import {
    createIntegrationOnlyEvent,
    runIntegrationEventPass,
} from '@helpers/integration-events.helpers';
import { signIntegrationWebhookBody } from '@helpers/integration-webhook-signature.helpers';

import { getUser } from './helpers/getClient';

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let readOnlyA: Awaited<ReturnType<typeof getUser>>;

const WEBHOOK_URL = 'https://hooks.example.com/learncard';

const run = (query: string, params: Record<string, unknown> = {}) =>
    neogma.queryRunner.run(query, params);

const answer = (status: number) => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => '',
});

// The first hook also boots the wallet and the database connection, which can be slow.
vi.setConfig({ hookTimeout: 30_000 });

describe('sendIntegrationTestEvent and the worker pass', () => {
    let integrationId: string;
    let secret: string;
    let fetchSpy: ReturnType<
        typeof vi.spyOn<typeof notificationTransport, 'fetchNotificationWebhook'>
    >;

    beforeAll(async () => {
        userA = await getUser('a'.repeat(64));
        userB = await getUser('b'.repeat(64));
        readOnlyA = await getUser('a'.repeat(64), 'integrations:read');
    });

    beforeEach(async () => {
        await run(
            `MATCH (n) WHERE n:IntegrationEvent OR n:ConsentFlowEvent OR n:ConsentFlowContract
             DETACH DELETE n`
        );
        await Integration.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({ profileId: 'testevent-usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'testevent-userb' });
        integrationId = await userA.clients.fullAuth.integrations.addIntegration({
            name: 'Test event',
            whitelistedDomains: [],
        });
        await userA.clients.fullAuth.integrations.setIntegrationWebhook({
            id: integrationId,
            webhookUrl: WEBHOOK_URL,
        });
        secret = (
            await userA.clients.fullAuth.integrations.rotateIntegrationWebhookSecret({
                id: integrationId,
            })
        ).secret;

        fetchSpy = vi
            .spyOn(notificationTransport, 'fetchNotificationWebhook')
            .mockResolvedValue(answer(200));
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => vi.restoreAllMocks());

    it('posts a signed integration.test event and does not write it to the feed', async () => {
        await expect(
            userA.clients.fullAuth.integrations.sendIntegrationTestEvent({ id: integrationId })
        ).resolves.toEqual({ delivered: true, status: 200 });

        expect(fetchSpy).toHaveBeenCalledOnce();

        const [destination, request] = fetchSpy.mock.calls[0]!;
        const body = JSON.parse(request.body);

        expect(destination).toBe(WEBHOOK_URL);
        expect(body).toMatchObject({
            sequence: 0,
            type: 'integration.test',
            role: 'owner',
        });
        expect(body.eventId).toMatch(/^test_[0-9a-f-]{36}$/);
        expect(body.deliveryKey).toBe(`${body.eventId}:${integrationId}`);
        expect(body.contractUri).toMatch(/:contract:integration-test$/);
        expect(request.headers['X-LearnCard-Event-Id']).toBe(body.eventId);
        expect(request.headers['X-LearnCard-Delivery']).toBe(body.deliveryKey);

        const parts = String(request.headers['X-LearnCard-Signature']).split(',');
        const timestamp = Number(parts[0]!.slice(2));

        expect(parts[1]).toBe(
            `v1=${signIntegrationWebhookBody({ secret, timestamp, body: request.body })}`
        );

        const feed = await userA.clients.fullAuth.integrations.getIntegrationEvents({
            id: integrationId,
        });
        const nodes = await run('MATCH (record:IntegrationEvent) RETURN count(record) AS total');

        expect(feed.records).toEqual([]);
        expect(Number(nodes.records[0]?.get('total'))).toBe(0);
    });

    it('reports the HTTP status when the receiver fails', async () => {
        fetchSpy.mockResolvedValue(answer(500));

        await expect(
            userA.clients.fullAuth.integrations.sendIntegrationTestEvent({ id: integrationId })
        ).resolves.toEqual({ delivered: false, status: 500, error: 'http_500' });
    });

    it('reports no_webhook without sending when there is no webhook URL', async () => {
        await userA.clients.fullAuth.integrations.setIntegrationWebhook({
            id: integrationId,
            webhookUrl: null,
        });

        await expect(
            userA.clients.fullAuth.integrations.sendIntegrationTestEvent({ id: integrationId })
        ).resolves.toEqual({ delivered: false, error: 'no_webhook' });
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('still sends the test event while contract events are disabled', async () => {
        await userA.clients.fullAuth.integrations.updateIntegration({
            id: integrationId,
            updates: { contractEventsEnabled: false },
        });

        await expect(
            userA.clients.fullAuth.integrations.sendIntegrationTestEvent({ id: integrationId })
        ).resolves.toEqual({ delivered: true, status: 200 });
        expect(fetchSpy).toHaveBeenCalledOnce();
        expect(JSON.parse(fetchSpy.mock.calls[0]![1].body).type).toBe('integration.test');
    });

    it('is refused for another profile and without the integrations:write scope', async () => {
        await expect(
            userB.clients.fullAuth.integrations.sendIntegrationTestEvent({ id: integrationId })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(
            readOnlyA.clients.fullAuth.integrations.sendIntegrationTestEvent({ id: integrationId })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('runIntegrationEventPass fans out and then delivers in one pass', async () => {
        await run(
            `MATCH (owner:Profile {profileId: 'testevent-usera'})
             CREATE (:ConsentFlowContract {id: 'testevent-contract'})-[:CREATED_BY]->(owner)`
        );
        await createIntegrationOnlyEvent({
            id: 'testevent-1',
            kind: 'contract_retired',
            contractId: 'testevent-contract',
        });

        await expect(runIntegrationEventPass({ limit: 100, budgetMs: 20_000 })).resolves.toEqual({
            events: 1,
            records: 1,
            delivered: 1,
            pending: 0,
            rejected: 0,
            failed: 0,
        });

        expect(fetchSpy).toHaveBeenCalledOnce();
        expect(JSON.parse(fetchSpy.mock.calls[0]![1].body)).toMatchObject({
            eventId: 'testevent-1',
            sequence: 1,
            type: 'contract_retired',
        });
    });
});
