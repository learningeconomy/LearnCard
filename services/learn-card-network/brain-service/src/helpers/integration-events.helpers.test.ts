import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IntegrationEvent } from '@learncard/types';

const { fetchNotificationWebhook } = vi.hoisted(() => ({ fetchNotificationWebhook: vi.fn() }));

vi.mock('@instance', () => ({ neogma: { queryRunner: { run: vi.fn() } } }));
vi.mock('@environment', () => ({
    environment: { IS_OFFLINE: false, DOMAIN_NAME: 'brain.example' },
}));
vi.mock('./contract-event-maintenance.helpers', () => ({
    ensureContractEventMaintenance: vi.fn(),
}));
vi.mock('./notification-webhook-fetch.helpers', async importOriginal => ({
    ...(await importOriginal<typeof import('./notification-webhook-fetch.helpers')>()),
    fetchNotificationWebhook,
}));

import { sendSignedIntegrationWebhook } from './integration-events.helpers';
import { signIntegrationWebhookBody } from './integration-webhook-signature.helpers';
import { UnsafeNotificationWebhookError } from './notification-webhook-fetch.helpers';

const webhookUrl = 'https://hooks.example.com/learncard?token=do-not-log';
const event: IntegrationEvent = {
    eventId: 'event-1',
    deliveryKey: 'event-1:integration-1',
    sequence: 3,
    type: 'consent_created',
    contractUri: 'lc:network:brain.example/trpc:contract:abc',
    role: 'owner',
    occurredAt: '2026-11-14T00:00:00.000Z',
};
const answer = (status: number) => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => 'ignored',
});

describe('sendSignedIntegrationWebhook', () => {
    beforeEach(() => {
        fetchNotificationWebhook.mockReset();
    });

    it('posts the exact JSON body with a valid signature and the id headers', async () => {
        fetchNotificationWebhook.mockResolvedValue(answer(200));

        const result = await sendSignedIntegrationWebhook({
            webhookUrl,
            secrets: ['whsec_current'],
            event,
        });

        expect(result).toEqual({
            delivered: true,
            status: 200,
            retryable: false,
            latencyMs: expect.any(Number),
        });
        expect(fetchNotificationWebhook).toHaveBeenCalledOnce();

        const [destination, request, isOffline] = fetchNotificationWebhook.mock.calls[0]!;

        expect(destination).toBe(webhookUrl);
        expect(isOffline).toBe(false);
        expect(request.method).toBe('POST');
        expect(request.body).toBe(JSON.stringify(event));
        expect(request.signal).toBeInstanceOf(AbortSignal);
        expect(request.headers['Content-Type']).toBe('application/json');
        expect(request.headers['X-LearnCard-Event-Id']).toBe('event-1');
        expect(request.headers['X-LearnCard-Delivery']).toBe('event-1:integration-1');
        expect(request.headers).not.toHaveProperty('Authorization');

        const header: string = request.headers['X-LearnCard-Signature'];
        const match = /^t=(\d+),v1=([0-9a-f]{64})$/.exec(header);

        expect(match).not.toBeNull();

        const timestamp = Number(match![1]);

        expect(Math.abs(timestamp - Math.floor(Date.now() / 1000))).toBeLessThanOrEqual(2);
        expect(match![2]).toBe(
            signIntegrationWebhookBody({ secret: 'whsec_current', timestamp, body: request.body })
        );
    });

    it('adds a second v1 value for the previous secret', async () => {
        fetchNotificationWebhook.mockResolvedValue(answer(204));

        const result = await sendSignedIntegrationWebhook({
            webhookUrl,
            secrets: ['whsec_current', 'whsec_previous'],
            event,
        });

        expect(result).toEqual({
            delivered: true,
            status: 204,
            retryable: false,
            latencyMs: expect.any(Number),
        });

        const request = fetchNotificationWebhook.mock.calls[0]![1];
        const parts: string[] = request.headers['X-LearnCard-Signature'].split(',');
        const timestamp = Number(parts[0]!.slice(2));

        expect(parts).toEqual([
            `t=${timestamp}`,
            `v1=${signIntegrationWebhookBody({ secret: 'whsec_current', timestamp, body: request.body })}`,
            `v1=${signIntegrationWebhookBody({ secret: 'whsec_previous', timestamp, body: request.body })}`,
        ]);
    });

    it.each([
        [500, true],
        [503, true],
        [408, true],
        [425, true],
        [429, true],
        [400, false],
        [401, false],
        [404, false],
        [410, false],
    ])('reports HTTP %d with retryable %s', async (status, retryable) => {
        fetchNotificationWebhook.mockResolvedValue(answer(status));

        await expect(
            sendSignedIntegrationWebhook({ webhookUrl, secrets: ['whsec_current'], event })
        ).resolves.toEqual({
            delivered: false,
            status,
            retryable,
            error: `http_${status}`,
            latencyMs: expect.any(Number),
        });
    });

    it('treats an unsafe destination as final', async () => {
        fetchNotificationWebhook.mockRejectedValue(new UnsafeNotificationWebhookError());

        await expect(
            sendSignedIntegrationWebhook({ webhookUrl, secrets: ['whsec_current'], event })
        ).resolves.toEqual({
            delivered: false,
            retryable: false,
            error: 'invalid_webhook',
            latencyMs: expect.any(Number),
        });
    });

    it('treats a network error as retryable and never reports the URL', async () => {
        fetchNotificationWebhook.mockRejectedValue(new Error(`connect ECONNREFUSED ${webhookUrl}`));

        const result = await sendSignedIntegrationWebhook({
            webhookUrl,
            secrets: ['whsec_current'],
            event,
        });

        expect(result).toEqual({
            delivered: false,
            retryable: true,
            error: 'network_error',
            latencyMs: expect.any(Number),
        });
        expect(JSON.stringify(result)).not.toContain('hooks.example.com');
    });

    it('aborts after the timeout and reports it as retryable', async () => {
        fetchNotificationWebhook.mockImplementation(
            (_destination: string, request: { signal: AbortSignal }) =>
                new Promise((_resolve, reject) => {
                    request.signal.addEventListener('abort', () => reject(new Error('aborted')));
                })
        );

        await expect(
            sendSignedIntegrationWebhook({
                webhookUrl,
                secrets: ['whsec_current'],
                event,
                timeoutMs: 20,
            })
        ).resolves.toEqual({
            delivered: false,
            retryable: true,
            error: 'timeout',
            latencyMs: expect.any(Number),
        });
    });
});
