import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Campaign, LCNNotification } from '@learncard/types';

const mocks = vi.hoisted(() => ({
    fetch: vi.fn(),
    acknowledge: vi.fn(),
    getCampaign: vi.fn(),
    recipient: vi.fn(),
    environment: {
        NODE_ENV: 'test',
        IS_OFFLINE: false,
        DOMAIN_NAME: 'brain.example',
        NOTIFICATIONS_SERVICE_WEBHOOK_URL: 'https://inbox.example/notifications',
    },
}));

vi.mock('./notification-webhook-fetch.helpers', () => ({
    fetchNotificationWebhook: (...args: unknown[]) => mocks.fetch(...args),
}));

vi.mock('@environment', () => ({
    environment: mocks.environment,
    getNotificationRuntimeEnvironment: () => mocks.environment,
}));
vi.mock('@helpers/learnCard.helpers', () => ({
    getDidWebLearnCard: async () => ({
        id: { did: () => 'did:web:brain.example' },
        invoke: { getDidAuthVp: async () => 'test-jwt' },
    }),
}));
vi.mock('@helpers/did.helpers', () => ({
    getDidWeb: (domain: string, profileId: string) => `did:web:${domain}:users:${profileId}`,
}));
vi.mock('@accesslayer/inbox-credential/relationships/create', () => ({
    createWebhookSentRelationship: vi.fn(),
}));
vi.mock('@cache', () => ({ default: {} }));
// These suites exercise notification delivery without email transport or a database.
vi.mock('@helpers/campaign-email.helpers', () => ({ sendCampaignEmail: vi.fn() }));
vi.mock('@accesslayer/campaign/preferences', () => ({
    getAnnouncementPreferences: async () => ({
        announcementEmailOptOut: false,
        announcementPushOptOut: false,
    }),
}));
vi.mock('@accesslayer/campaign/read', () => ({ getCampaign: mocks.getCampaign }));
vi.mock('@accesslayer/campaign/test', () => ({ queueCampaignInAppTest: vi.fn() }));
vi.mock('@accesslayer/campaign/delivery', () => ({
    getCampaignDeliveryRecipient: mocks.recipient,
    acknowledgeCampaignNotification: mocks.acknowledge,
}));
vi.mock('@helpers/contract-events.helpers', () => ({
    authorizeContractNotification: async () => true,
}));
vi.mock('@helpers/connectionPrompt.helpers', () => ({
    acknowledgeConnectionPromptNotificationDelivery: vi.fn(),
}));

import { buildCampaignNotification } from './campaign-notifications.helpers';
import { deliverQueuedNotification } from './notificationQueue.helpers';

const campaign = {
    id: 'webhook-pilot',
    createdAt: '2026-01-01T00:00:00Z',
    status: 'live',
    channels: ['notify'],
    notification: { title: 'Explore', body: 'Find your next step' },
} as Campaign;
const recipient = {
    profileId: 'learner',
    did: 'did:web:brain.example:users:learner',
    notificationsWebhook: 'https://receiver.example/notifications',
};

beforeEach(() => {
    vi.resetAllMocks();
    mocks.environment.NOTIFICATIONS_SERVICE_WEBHOOK_URL = 'https://inbox.example/notifications';
    mocks.getCampaign.mockResolvedValue(campaign);
    mocks.recipient.mockResolvedValue(recipient);
});

describe('campaign custom webhook storage contract', () => {
    it.each([
        true,
        { sent: true },
        { success: true },
        { ok: true },
        { data: { success: true } },
        { result: { data: { sent: true } } },
    ])('acknowledges recognized durable storage response %j', async response => {
        mocks.fetch.mockResolvedValue(new Response(JSON.stringify(response)));
        const notification = await buildCampaignNotification(campaign, recipient);

        await deliverQueuedNotification(JSON.stringify(notification));

        expect(mocks.fetch).toHaveBeenCalledWith(
            recipient.notificationsWebhook,
            expect.objectContaining({ method: 'POST' }),
            false
        );
        expect(mocks.acknowledge).toHaveBeenCalledOnce();
        expect(mocks.acknowledge).toHaveBeenCalledWith(
            expect.objectContaining({
                data: notification.data,
            })
        );
    });

    it.each([
        { status: 204, body: null },
        { status: 200, body: '' },
        { status: 202, body: 'accepted' },
        { status: 200, body: '{"status":"ok"}' },
        { status: 200, body: '{"sent":false}' },
        { status: 200, body: '{"success":false}' },
        { status: 200, body: '{"ok":false}' },
    ])('retries without counting storage for $status / $body', async ({ status, body }) => {
        mocks.fetch.mockResolvedValueOnce(new Response(body, { status }));
        const notification = await buildCampaignNotification(campaign, recipient);
        const queuedBody = JSON.stringify(notification);

        await expect(deliverQueuedNotification(queuedBody)).rejects.toThrow();
        expect(mocks.acknowledge).not.toHaveBeenCalled();

        mocks.fetch.mockResolvedValueOnce(new Response('{"sent":true}'));
        await deliverQueuedNotification(queuedBody);
        expect(mocks.fetch).toHaveBeenCalledTimes(2);
        expect(mocks.acknowledge).toHaveBeenCalledOnce();
        const attempts = mocks.fetch.mock.calls.map(
            ([, request]) => JSON.parse(request.body) as LCNNotification
        );
        // A receiver can deduplicate even if its first storage acknowledgement was lost.
        expect(attempts[1]!.data?.metadata).toEqual(attempts[0]!.data?.metadata);
        expect(attempts[1]!.to.did).toBe(attempts[0]!.to.did);
        expect(attempts[1]!.from).toEqual(attempts[0]!.from);
    });
});
