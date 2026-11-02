import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Campaign } from '@learncard/types';

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
import { sendNotification } from './notifications.helpers';
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
    vi.stubGlobal('fetch', mocks.fetch);
    mocks.environment.NOTIFICATIONS_SERVICE_WEBHOOK_URL = 'https://inbox.example/notifications';
    mocks.getCampaign.mockResolvedValue(campaign);
    mocks.recipient.mockResolvedValue(recipient);
});

describe('shared notification delivery boundary', () => {
    it.each(['ANNOUNCEMENT', 'BOOST_ACCEPTED'] as const)(
        'blocks a private profile webhook for %s before POST or acknowledgement',
        async type => {
            const notification = await buildCampaignNotification(campaign, recipient);
            notification.type = type;
            notification.to.notificationsWebhook = 'http://10.0.1.10/internal';

            await expect(
                sendNotification(notification, {
                    propagateDirectWebhookTransportErrors: true,
                })
            ).rejects.toThrow('public HTTP(S) destination');
            expect(mocks.fetch).not.toHaveBeenCalled();
            expect(mocks.acknowledge).not.toHaveBeenCalled();
        }
    );

    it('does not trust an explicit queued webhook override', async () => {
        const notification = await buildCampaignNotification(campaign, recipient);
        notification.webhookUrl = 'http://169.254.169.254/latest/meta-data/';
        await expect(deliverQueuedNotification(JSON.stringify(notification))).rejects.toThrow();
        expect(mocks.fetch).not.toHaveBeenCalled();
        expect(mocks.acknowledge).not.toHaveBeenCalled();
    });

    it('also guards the configured default destination', async () => {
        const notification = await buildCampaignNotification(campaign, recipient);
        delete notification.to.notificationsWebhook;
        mocks.environment.NOTIFICATIONS_SERVICE_WEBHOOK_URL = 'http://[::1]/internal';
        await expect(sendNotification(notification)).resolves.toBe(false);
        expect(mocks.fetch).not.toHaveBeenCalled();
    });
});
afterEach(() => vi.unstubAllGlobals());
