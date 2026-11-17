import { randomBytes } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { neogma } from '@instance';
import { environment } from '@environment';
import { isAuthGrantChallengeValidForDID } from '@accesslayer/auth-grant/read';
import { INTEGRATION_WEBHOOK_STATUS_CYPHER } from '@accesslayer/integration/webhook';
import { ensureContractEventMaintenance } from '@helpers/contract-event-maintenance.helpers';
import {
    createIntegrationOnlyEvent,
    dispatchIntegrationWebhooks,
    fanOutIntegrationEvents,
} from '@helpers/integration-events.helpers';
import { signIntegrationWebhookBody } from '@helpers/integration-webhook-signature.helpers';

import { appRouter } from '../src/app';
import { getUser } from './helpers/getClient';

const DOMAIN = 'localhost%3A3000';

const run = (query: string, params: Record<string, unknown> = {}) =>
    neogma.queryRunner.run(query, params);

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type Received = { signature: string; body: string };

/** A real HTTP receiver on the loopback interface. `status` is what it answers next. */
const startReceiver = async () => {
    const received: Received[] = [];
    const state = { status: 200 };
    const server: Server = createServer((request, response) => {
        const chunks: Buffer[] = [];

        request.on('data', chunk => chunks.push(chunk));
        request.on('end', () => {
            received.push({
                signature: String(request.headers['x-learncard-signature']),
                body: Buffer.concat(chunks).toString('utf8'),
            });
            response.statusCode = state.status;
            response.end('this body is never reported');
        });
    });

    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));

    const { port } = server.address() as AddressInfo;

    return {
        url: `http://127.0.0.1:${port}/learncard/events`,
        received,
        state,
        close: () => new Promise<void>(resolve => server.close(() => resolve())),
    };
};

/** A port on the loopback interface that nothing listens on. */
const closedPortUrl = async (): Promise<string> => {
    const server = createServer();

    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));

    const { port } = server.address() as AddressInfo;

    await new Promise<void>(resolve => server.close(() => resolve()));

    return `http://127.0.0.1:${port}/nobody-home`;
};

/** Every `v1=` value of a signature header, and its timestamp. */
const parseSignature = (header: string): { timestamp: number; signatures: string[] } => {
    const parts = header.split(',');

    return {
        timestamp: Number(parts[0]!.slice(2)),
        signatures: parts.slice(1).map(part => part.replace(/^v1=/, '')),
    };
};

/**
 * A caller that holds only an API token. API tokens are auth grants of a profile; they are not
 * linked to one Integration. The grant is created through the real route and resolved with the
 * same lookup the HTTP context uses for a token, so the caller has exactly the grant's scope.
 */
const apiTokenCaller = async (
    owner: Awaited<ReturnType<typeof getUser>>,
    profileId: string,
    scope: string
) => {
    const grantId = await owner.clients.fullAuth.authGrants.addAuthGrant({
        name: `token ${scope}`,
        scope,
    });
    const grant = await owner.clients.fullAuth.authGrants.getAuthGrant({ id: grantId });
    const did = `did:web:${DOMAIN}:users:${profileId}`;
    const resolved = await isAuthGrantChallengeValidForDID(String(grant?.challenge), did);

    expect(resolved).toMatchObject({ isChallengeValid: true, scope });

    return appRouter.createCaller({
        domain: DOMAIN,
        user: { did, isChallengeValid: true, scope: resolved.scope, isAuthGrant: true },
    });
};

// The first hook also boots the wallet and the database connection, which can be slow.
vi.setConfig({ hookTimeout: 60_000, testTimeout: 60_000 });

describe('LC-2370 acceptance: webhook setup with only an API token', () => {
    let receiver: Awaited<ReturnType<typeof startReceiver>>;
    let profileId: string;
    let token: Awaited<ReturnType<typeof apiTokenCaller>>;
    let readOnlyToken: Awaited<ReturnType<typeof apiTokenCaller>>;
    let integrationId: string;
    let wasOffline: typeof environment.IS_OFFLINE;

    /** Writes one feed record for the integration, as a contract change would. */
    const seedFeedRecord = async (): Promise<void> => {
        const contractId = `acceptance-contract-${randomBytes(5).toString('hex')}`;

        await run(
            `MATCH (owner:Profile {profileId: $profileId})
             CREATE (:ConsentFlowContract {id: $contractId})-[:CREATED_BY]->(owner)`,
            { profileId, contractId }
        );
        await createIntegrationOnlyEvent({
            id: `${contractId}:retired`,
            kind: 'contract_retired',
            contractId,
        });
        await fanOutIntegrationEvents({ contractId });
    };

    /** Makes every pending record of the integration due now, as passing time would. */
    const makeRetriesDue = async (): Promise<void> => {
        await run(
            `MATCH (record:IntegrationEvent {integrationId: $integrationId, deliveryState: 'pending'})
             SET record.nextAttemptAt = '2020-01-01T00:00:00.000Z'`,
            { integrationId }
        );
    };

    beforeAll(async () => {
        receiver = await startReceiver();
        await ensureContractEventMaintenance();
    });

    afterAll(async () => {
        await receiver.close();
    });

    beforeEach(async () => {
        // Local development mode of the webhook transport: loopback receivers are allowed.
        wasOffline = environment.IS_OFFLINE;
        environment.IS_OFFLINE = true;
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        receiver.received.length = 0;
        receiver.state.status = 200;

        const owner = await getUser(randomBytes(32).toString('hex'));

        profileId = `acceptance-${randomBytes(5).toString('hex')}`;
        await owner.clients.fullAuth.profile.createProfile({ profileId });
        token = await apiTokenCaller(owner, profileId, 'integrations:read integrations:write');
        readOnlyToken = await apiTokenCaller(owner, profileId, 'integrations:read');

        // From here on, nothing but the API token is used.
        integrationId = await token.integrations.addIntegration({
            name: 'Salesforce',
            whitelistedDomains: [],
        });
    });

    afterEach(() => {
        environment.IS_OFFLINE = wasOffline;
        vi.restoreAllMocks();
    });

    it('registers a webhook, receives the secret once, and pings it', async () => {
        const before = await token.integrations.getIntegrationWebhook({ id: integrationId });

        expect(before).toEqual({
            webhookUrl: null,
            state: 'disabled',
            hasSecret: false,
            secretVersion: 0,
            pendingDeliveries: 0,
            retryingDeliveries: 0,
        });

        const registration = await token.integrations.setIntegrationWebhook({
            id: integrationId,
            webhookUrl: receiver.url,
        });
        const secret = registration.secret!;

        expect(secret).toMatch(/^whsec_/);
        expect(registration.webhookUrl).toBe(receiver.url);

        const registered = await token.integrations.getIntegrationWebhook({ id: integrationId });

        expect(registered).toEqual({
            webhookUrl: receiver.url,
            state: 'active',
            contractEventsEnabledAt: registration.contractEventsEnabledAt,
            hasSecret: true,
            secretVersion: 1,
            pendingDeliveries: 0,
            retryingDeliveries: 0,
        });
        // The secret is returned by registration only.
        expect(JSON.stringify(registered)).not.toContain(secret);
        expect(
            JSON.stringify(await token.integrations.getIntegration({ id: integrationId }))
        ).not.toContain(secret);

        const ping = await token.integrations.sendIntegrationTestEvent({ id: integrationId });

        expect(ping).toEqual({ delivered: true, httpStatus: 200, latencyMs: expect.any(Number) });
        expect(ping.latencyMs).toBeGreaterThanOrEqual(0);
        expect(ping.latencyMs).toBeLessThan(6_000);

        // The receiver got one request signed with the secret from registration.
        expect(receiver.received).toHaveLength(1);

        const { signature, body } = receiver.received[0]!;
        const { timestamp, signatures } = parseSignature(signature);

        expect(JSON.parse(body).type).toBe('integration.test');
        expect(signatures).toEqual([signIntegrationWebhookBody({ secret, timestamp, body })]);

        const health = await token.integrations.getIntegrationWebhook({ id: integrationId });

        expect(health.state).toBe('active');
        expect(health.lastSuccessAt).toEqual(expect.any(String));
        expect(health).not.toHaveProperty('lastFailureAt');
        expect(health).not.toHaveProperty('lastFailureReason');
    });

    it('reports why a ping failed: HTTP status, unreachable host, unsafe address', async () => {
        await token.integrations.setIntegrationWebhook({
            id: integrationId,
            webhookUrl: receiver.url,
        });
        await token.integrations.sendIntegrationTestEvent({ id: integrationId });
        await sleep(5);

        // "Salesforce returned 401: check your Site settings".
        receiver.state.status = 401;

        await expect(
            token.integrations.sendIntegrationTestEvent({ id: integrationId })
        ).resolves.toEqual({
            delivered: false,
            httpStatus: 401,
            latencyMs: expect.any(Number),
            error: 'http_401',
        });

        const afterRefusal = await token.integrations.getIntegrationWebhook({ id: integrationId });

        expect(afterRefusal).toMatchObject({
            state: 'failing',
            lastSuccessAt: expect.any(String),
            lastFailureAt: expect.any(String),
            lastFailureReason: 'http_401',
        });
        // Only the fixed code is kept: no URL and nothing the receiver answered.
        expect(JSON.stringify(afterRefusal)).not.toContain('never reported');

        // An address nothing listens on. A new URL starts with empty health.
        await token.integrations.setIntegrationWebhook({
            id: integrationId,
            webhookUrl: await closedPortUrl(),
        });

        const afterUrlChange = await token.integrations.getIntegrationWebhook({
            id: integrationId,
        });

        expect(afterUrlChange.state).toBe('active');
        expect(afterUrlChange).not.toHaveProperty('lastFailureAt');
        expect(afterUrlChange).not.toHaveProperty('lastSuccessAt');

        const unreachable = await token.integrations.sendIntegrationTestEvent({
            id: integrationId,
        });

        expect(unreachable).toEqual({
            delivered: false,
            latencyMs: expect.any(Number),
            error: 'network_error',
        });
        expect(await token.integrations.getIntegrationWebhook({ id: integrationId })).toMatchObject(
            { state: 'failing', lastFailureReason: 'network_error' }
        );

        // Outside local development mode a loopback address is refused before any request.
        environment.IS_OFFLINE = false;

        await expect(
            token.integrations.sendIntegrationTestEvent({ id: integrationId })
        ).resolves.toEqual({
            delivered: false,
            error: 'invalid_webhook',
        });
        expect(await token.integrations.getIntegrationWebhook({ id: integrationId })).toMatchObject(
            { state: 'failing', lastFailureReason: 'invalid_webhook' }
        );
    });

    it('shows delivery health: active, failing while deliveries fail, active again', async () => {
        await token.integrations.setIntegrationWebhook({
            id: integrationId,
            webhookUrl: receiver.url,
        });

        // Two changes are waiting for their first attempt.
        await seedFeedRecord();
        await seedFeedRecord();

        expect(await token.integrations.getIntegrationWebhook({ id: integrationId })).toMatchObject(
            { state: 'active', pendingDeliveries: 2, retryingDeliveries: 0 }
        );

        // The receiver is down: both attempts fail and are scheduled again.
        receiver.state.status = 503;
        await dispatchIntegrationWebhooks();

        const failing = await token.integrations.getIntegrationWebhook({ id: integrationId });

        expect(failing).toMatchObject({
            state: 'failing',
            lastFailureAt: expect.any(String),
            lastFailureReason: 'http_503',
            pendingDeliveries: 0,
            retryingDeliveries: 2,
        });
        expect(failing).not.toHaveProperty('lastSuccessAt');

        // A third change arrives while the other two wait for their retry.
        await seedFeedRecord();

        expect(await token.integrations.getIntegrationWebhook({ id: integrationId })).toMatchObject(
            { state: 'failing', pendingDeliveries: 1, retryingDeliveries: 2 }
        );

        // The receiver is back. The retries become due and everything is delivered.
        receiver.state.status = 200;
        await makeRetriesDue();
        await sleep(5);
        await expect(dispatchIntegrationWebhooks()).resolves.toMatchObject({ delivered: 3 });

        const recovered = await token.integrations.getIntegrationWebhook({ id: integrationId });

        expect(recovered).toMatchObject({
            state: 'active',
            lastFailureReason: 'http_503',
            pendingDeliveries: 0,
            retryingDeliveries: 0,
        });
        expect(Date.parse(recovered.lastSuccessAt!)).toBeGreaterThan(
            Date.parse(recovered.lastFailureAt!)
        );

        // A receiver that refuses for good: the record is final, health says failing.
        await seedFeedRecord();
        receiver.state.status = 401;
        await sleep(5);
        await expect(dispatchIntegrationWebhooks()).resolves.toMatchObject({ rejected: 1 });

        expect(await token.integrations.getIntegrationWebhook({ id: integrationId })).toMatchObject(
            {
                state: 'failing',
                lastFailureReason: 'http_401',
                pendingDeliveries: 0,
                retryingDeliveries: 0,
            }
        );

        // Disabling contract events is its own state.
        await token.integrations.updateIntegration({
            id: integrationId,
            updates: { contractEventsEnabled: false },
        });

        expect((await token.integrations.getIntegrationWebhook({ id: integrationId })).state).toBe(
            'disabled'
        );
    });

    it('raises the secret version on rotation and signs with both secrets during the overlap', async () => {
        const first = (
            await token.integrations.setIntegrationWebhook({
                id: integrationId,
                webhookUrl: receiver.url,
            })
        ).secret!;
        const rotation = await token.integrations.rotateIntegrationWebhookSecret({
            id: integrationId,
        });

        expect(rotation.secret).not.toBe(first);

        const status = await token.integrations.getIntegrationWebhook({ id: integrationId });

        expect(status).toMatchObject({
            hasSecret: true,
            secretVersion: 2,
            previousSecretExpiresAt: rotation.previousSecretExpiresAt,
        });
        expect(JSON.stringify(status)).not.toContain(first);
        expect(JSON.stringify(status)).not.toContain(rotation.secret);

        await token.integrations.sendIntegrationTestEvent({ id: integrationId });

        const { signature, body } = receiver.received[0]!;
        const { timestamp, signatures } = parseSignature(signature);

        expect(signatures).toEqual([
            signIntegrationWebhookBody({ secret: rotation.secret, timestamp, body }),
            signIntegrationWebhookBody({ secret: first, timestamp, body }),
        ]);

        await token.integrations.rotateIntegrationWebhookSecret({ id: integrationId });

        expect(
            (await token.integrations.getIntegrationWebhook({ id: integrationId })).secretVersion
        ).toBe(3);
    });

    it('treats a secret stored before versions existed as version 1', async () => {
        await token.integrations.setIntegrationWebhook({
            id: integrationId,
            webhookUrl: receiver.url,
        });
        await run('MATCH (i:Integration {id: $id}) REMOVE i.webhookSecretVersion', {
            id: integrationId,
        });

        expect(
            (await token.integrations.getIntegrationWebhook({ id: integrationId })).secretVersion
        ).toBe(1);

        await token.integrations.rotateIntegrationWebhookSecret({ id: integrationId });

        expect(
            (await token.integrations.getIntegrationWebhook({ id: integrationId })).secretVersion
        ).toBe(2);
    });

    it('lets a read-only token read health, and nothing else', async () => {
        await token.integrations.setIntegrationWebhook({
            id: integrationId,
            webhookUrl: receiver.url,
        });

        await expect(
            readOnlyToken.integrations.getIntegrationWebhook({ id: integrationId })
        ).resolves.toMatchObject({ state: 'active', secretVersion: 1 });
        await expect(
            readOnlyToken.integrations.setIntegrationWebhook({
                id: integrationId,
                webhookUrl: null,
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(
            readOnlyToken.integrations.sendIntegrationTestEvent({ id: integrationId })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(
            readOnlyToken.integrations.rotateIntegrationWebhookSecret({ id: integrationId })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

        // Another profile's token cannot read it either.
        const stranger = await getUser(randomBytes(32).toString('hex'));
        const strangerId = `acceptance-${randomBytes(5).toString('hex')}`;

        await stranger.clients.fullAuth.profile.createProfile({ profileId: strangerId });

        const strangerToken = await apiTokenCaller(stranger, strangerId, 'integrations:read');

        await expect(
            strangerToken.integrations.getIntegrationWebhook({ id: integrationId })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        expect(receiver.received).toHaveLength(0);
    });

    it('counts deliveries from the index', async () => {
        const result = await run(`EXPLAIN ${INTEGRATION_WEBHOOK_STATUS_CYPHER}`, {
            id: integrationId,
        });
        type Plan = {
            operatorType: string;
            arguments?: Record<string, unknown>;
            children?: Plan[];
        };
        const operators: { type: string; details: string }[] = [];
        const walk = (plan: Plan): void => {
            operators.push({
                type: plan.operatorType,
                details: String(plan.arguments?.Details ?? ''),
            });
            (plan.children ?? []).forEach(walk);
        };

        walk(result.summary.plan as unknown as Plan);

        // Both counts seek the (integrationId, deliveryState, attempts) index; nothing scans.
        const eventSeeks = operators.filter(
            operator =>
                /NodeIndexSeek/.test(operator.type) &&
                operator.details.includes(
                    'record:IntegrationEvent(integrationId, deliveryState, attempts)'
                )
        );

        expect(eventSeeks).toHaveLength(2);
        expect(operators.some(operator => /LabelScan|AllNodesScan/.test(operator.type))).toBe(
            false
        );
    });
});
