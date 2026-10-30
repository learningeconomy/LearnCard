import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import type { Campaign, LCNNotification } from '@learncard/types';

const mocks = vi.hoisted(() => ({
    getCampaign: vi.fn(),
    confirmDispatch: vi.fn(),
    queueTest: vi.fn(),
    pageAudience: vi.fn(),
    recipient: vi.fn(),
    acknowledge: vi.fn(),
    enqueue: vi.fn(),
    send: vi.fn(),
    sqs: vi.fn(),
    environment: {
        IS_OFFLINE: false,
        CAMPAIGN_QUEUE_URL: 'https://sqs.example/campaigns',
        CAMPAIGN_DISPATCH_PAGE_SIZE: 1000,
        CAMPAIGN_DISPATCH_DELAY_SECONDS: 60,
    },
}));
vi.mock('@environment', () => ({ environment: mocks.environment }));
vi.mock('@aws-sdk/client-sqs', () => ({
    SQSClient: class {
        send = mocks.sqs;
    },
    SendMessageCommand: class {
        constructor(public input: unknown) {}
    },
}));
vi.mock('@accesslayer/campaign/test', () => ({ queueCampaignInAppTest: mocks.queueTest }));
vi.mock('@accesslayer/campaign/dispatch', () => ({
    authorizeConfirmedCampaignDispatch: mocks.confirmDispatch,
}));
vi.mock('@accesslayer/campaign/read', () => ({ getCampaign: mocks.getCampaign }));
vi.mock('@accesslayer/campaign/audience', () => ({ pageCampaignAudience: mocks.pageAudience }));
vi.mock('@accesslayer/campaign/delivery', () => ({
    getCampaignDeliveryRecipient: mocks.recipient,
    acknowledgeCampaignNotification: mocks.acknowledge,
}));
vi.mock('@helpers/learnCard.helpers', () => ({
    getDidWebLearnCard: async () => ({ id: { did: () => 'did:web:brain.example' } }),
}));
vi.mock('@helpers/notifications.helpers', () => ({
    addNotificationToQueue: mocks.enqueue,
    sendNotification: mocks.send,
    PermanentNotificationDeliveryError: class extends Error {},
}));
vi.mock('@helpers/contract-events.helpers', () => ({
    authorizeContractNotification: async () => true,
}));
vi.mock('@helpers/connectionPrompt.helpers', () => ({
    acknowledgeConnectionPromptNotificationDelivery: vi.fn(),
}));
vi.mock('@tracing', () => ({
    trace: async (_op: string, _name: string, fn: () => unknown) => fn(),
}));

import {
    dispatchCampaign,
    processCampaignDispatchJob,
    addCampaignDispatchToQueue,
} from './campaign-queue.helpers';
import { buildCampaignNotification, sendCampaignTestToMe } from './campaign-notifications.helpers';
import { deliverQueuedNotification } from './notificationQueue.helpers';

const campaign = {
    id: 'pilot-clr',
    createdAt: '2026-01-01T00:00:00Z',
    status: 'live',
    channels: ['notify'],
    notification: { title: 'Explore', body: 'Find your next step' },
} as Campaign;
const job = {
    campaignId: campaign.id,
    campaignCreatedAt: campaign.createdAt,
    dispatchId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
};
const recipient = (profileId = 'learner') => ({ profileId, did: `did:key:${profileId}` });

beforeEach(() => {
    vi.resetAllMocks();
    mocks.environment.IS_OFFLINE = false;
    mocks.environment.CAMPAIGN_DISPATCH_PAGE_SIZE = 1000;
    mocks.environment.CAMPAIGN_DISPATCH_DELAY_SECONDS = 60;
    mocks.getCampaign.mockResolvedValue(campaign);
    mocks.recipient.mockImplementation(async (_id, _createdAt, profileId) => recipient(profileId));
    mocks.pageAudience.mockResolvedValue({ records: [recipient()], hasMore: false });
    mocks.enqueue.mockResolvedValue({ MessageId: 'queued' });
    mocks.send.mockResolvedValue(true);
});

describe('campaign wave dispatch', () => {
    it('validates a reviewed preview before enqueuing and refuses stale confirmations', async () => {
        mocks.confirmDispatch.mockResolvedValueOnce(campaign);
        await dispatchCampaign(campaign.id, 'a'.repeat(64));
        expect(mocks.confirmDispatch).toHaveBeenCalledWith(campaign.id, 'a'.repeat(64));
        expect(mocks.sqs).toHaveBeenCalledTimes(1);
        mocks.confirmDispatch.mockRejectedValueOnce(new TRPCError({ code: 'CONFLICT' }));
        await expect(dispatchCampaign(campaign.id, 'a'.repeat(64))).rejects.toMatchObject({
            code: 'CONFLICT',
        });
        expect(mocks.sqs).toHaveBeenCalledTimes(1);
    });

    it('delivers 2500 recipients in three waves with stable cursors and configured delay', async () => {
        const profiles = Array.from({ length: 2500 }, (_, i) =>
            recipient(String(i).padStart(4, '0'))
        );
        mocks.pageAudience.mockImplementation(async (_id, cursor, limit) => ({
            records: profiles.filter(p => !cursor || p.profileId > cursor).slice(0, limit),
        }));
        await processCampaignDispatchJob(job);
        expect(mocks.enqueue).toHaveBeenCalledTimes(1000);
        const second = mocks.sqs.mock.calls[0]![0].input;
        expect(second.DelaySeconds).toBe(60);
        expect(JSON.parse(second.MessageBody)).toEqual({ ...job, afterProfileId: '0999' });
        await processCampaignDispatchJob(JSON.parse(second.MessageBody));
        expect(mocks.enqueue).toHaveBeenCalledTimes(2000);
        const third = mocks.sqs.mock.calls[1]![0].input;
        expect(third.DelaySeconds).toBe(60);
        expect(JSON.parse(third.MessageBody)).toEqual({ ...job, afterProfileId: '1999' });
        await processCampaignDispatchJob(JSON.parse(third.MessageBody));
        expect(mocks.enqueue).toHaveBeenCalledTimes(2500);
        expect(mocks.sqs).toHaveBeenCalledTimes(2);
        expect(mocks.acknowledge).not.toHaveBeenCalled();
    });

    it.each(['draft', 'paused', 'archived'])(
        'stops %s campaigns and rejects new dispatch',
        async status => {
            mocks.getCampaign.mockResolvedValue({ ...campaign, status });
            await processCampaignDispatchJob(job);
            await expect(dispatchCampaign(campaign.id)).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
            expect(mocks.pageAudience).not.toHaveBeenCalled();
            expect(mocks.enqueue).not.toHaveBeenCalled();
        }
    );

    it.each([
        { channels: ['inApp'] },
        { startsAt: '2999-01-01T00:00:00Z' },
        { endsAt: '2000-01-01T00:00:00Z' },
        { createdAt: '2026-02-01T00:00:00Z' },
    ])('ignores out-of-window, disabled notify and replaced campaigns (%j)', async changes => {
        mocks.getCampaign.mockResolvedValue({ ...campaign, ...changes });
        await processCampaignDispatchJob(job);
        expect(mocks.enqueue).not.toHaveBeenCalled();
    });

    it('discards deleted campaigns but retries database failures', async () => {
        mocks.getCampaign.mockRejectedValueOnce(new TRPCError({ code: 'NOT_FOUND' }));
        await expect(processCampaignDispatchJob(job)).resolves.toBeUndefined();
        mocks.getCampaign.mockRejectedValueOnce(new Error('database unavailable'));
        await expect(processCampaignDispatchJob(job)).rejects.toThrow('database unavailable');
    });

    it('rechecks eligibility and skips already-notified recipients on re-dispatch', async () => {
        mocks.recipient.mockResolvedValue(undefined);
        await processCampaignDispatchJob(job);
        expect(mocks.enqueue).not.toHaveBeenCalled();
    });

    it('preserves notification identity after uncertain enqueue and concurrent retries', async () => {
        mocks.enqueue.mockRejectedValueOnce(new Error('lost enqueue response'));
        await expect(processCampaignDispatchJob(job)).rejects.toThrow('lost enqueue response');
        expect(mocks.acknowledge).not.toHaveBeenCalled();
        await Promise.all([
            processCampaignDispatchJob(job),
            processCampaignDispatchJob({
                ...job,
                dispatchId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
            }),
        ]);
        const payloads = mocks.enqueue.mock.calls.map(([notification]) => notification);
        expect(payloads).toEqual([payloads[0], payloads[0], payloads[0]]);
    });

    it('retries the page if scheduling its continuation fails', async () => {
        mocks.environment.CAMPAIGN_DISPATCH_PAGE_SIZE = 1;
        mocks.sqs.mockRejectedValueOnce(new Error('queue unavailable'));
        await expect(processCampaignDispatchJob(job)).rejects.toThrow('queue unavailable');
        await processCampaignDispatchJob(job);
        expect(mocks.sqs).toHaveBeenCalledTimes(2);
        expect(mocks.sqs.mock.calls[0]![0].input).toEqual(mocks.sqs.mock.calls[1]![0].input);
    });

    it('runs the local fallback with the configured delay', async () => {
        vi.useFakeTimers();
        try {
            mocks.environment.IS_OFFLINE = true;
            const pending = addCampaignDispatchToQueue(job, 2);
            await vi.advanceTimersByTimeAsync(1999);
            expect(mocks.enqueue).not.toHaveBeenCalled();
            await vi.advanceTimersByTimeAsync(1);
            await pending;
            expect(mocks.enqueue).toHaveBeenCalledOnce();
            expect(mocks.sqs).not.toHaveBeenCalled();
        } finally {
            vi.useRealTimers();
        }
    });
});

describe('campaign delivery acknowledgement', () => {
    it('retries graph acknowledgement failure using the same receiver identity', async () => {
        const notification = await buildCampaignNotification(campaign, recipient());
        mocks.acknowledge.mockRejectedValueOnce(new Error('graph unavailable'));
        await expect(deliverQueuedNotification(JSON.stringify(notification))).rejects.toThrow(
            'graph unavailable'
        );
        await deliverQueuedNotification(JSON.stringify(notification));
        expect(mocks.send).toHaveBeenCalledTimes(2);
        expect(mocks.send.mock.calls[0]![0]).toEqual(mocks.send.mock.calls[1]![0]);
    });

    it('does not acknowledge failed storage, and suppresses queued work after pause', async () => {
        const body = JSON.stringify(await buildCampaignNotification(campaign, recipient()));
        mocks.send.mockResolvedValue(false);
        await expect(deliverQueuedNotification(body)).rejects.toThrow('not durably stored');
        expect(mocks.acknowledge).not.toHaveBeenCalled();
        mocks.getCampaign.mockResolvedValue({ ...campaign, status: 'paused' });
        await deliverQueuedNotification(body);
        expect(mocks.send).toHaveBeenCalledOnce();
    });

    it('queues an in-app-only test without requiring or sending notification copy', async () => {
        const privateCampaign = {
            ...campaign,
            channels: ['inApp'],
            notification: undefined,
            message: { id: campaign.id, title: 'Private' },
        };
        mocks.getCampaign.mockResolvedValue(privateCampaign);
        await sendCampaignTestToMe(campaign.id, recipient('admin'));
        expect(mocks.queueTest).toHaveBeenCalledWith(privateCampaign, 'admin', expect.any(String));
        expect(mocks.enqueue).not.toHaveBeenCalled();
    });
    it('tests both selected channels using the same private test identity', async () => {
        const privateCampaign = {
            ...campaign,
            channels: ['inApp', 'notify'],
            message: { id: campaign.id, title: 'Private' },
        };
        mocks.getCampaign.mockResolvedValue(privateCampaign);
        await sendCampaignTestToMe(campaign.id, recipient('admin'));
        expect(mocks.queueTest.mock.calls[0]?.[2]).toBe(
            mocks.enqueue.mock.calls[0]?.[0].data.metadata.campaignTestId
        );
    });
    it('test-to-me ignores status/audience, targets only the caller and distinguishes explicit tests', async () => {
        mocks.getCampaign.mockResolvedValue({
            ...campaign,
            status: 'archived',
            channels: ['notify'],
        });
        await sendCampaignTestToMe(campaign.id, recipient('admin'));
        await sendCampaignTestToMe(campaign.id, recipient('admin'));
        const first = mocks.enqueue.mock.calls[0]![0] as LCNNotification;
        const second = mocks.enqueue.mock.calls[1]![0] as LCNNotification;
        expect(first.to).toEqual(recipient('admin'));
        expect(first.data?.metadata?.campaignTestId).not.toBe(
            second.data?.metadata?.campaignTestId
        );
        await deliverQueuedNotification(JSON.stringify(first));
        expect(mocks.send).toHaveBeenCalledOnce();
        expect(mocks.recipient).not.toHaveBeenCalled();
    });
});
