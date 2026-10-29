import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import type { Campaign, LCNNotification } from '@learncard/types';
import { getCampaign } from '@accesslayer/campaign/read';
import { queueCampaignInAppTest } from '@accesslayer/campaign/test';
import {
    acknowledgeCampaignNotification,
    getCampaignDeliveryRecipient,
} from '@accesslayer/campaign/delivery';
import { getDidWebLearnCard } from '@helpers/learnCard.helpers';
import { addNotificationToQueue } from '@helpers/notifications.helpers';

export const canDispatchCampaign = (campaign: Campaign, now = new Date().toISOString()): boolean =>
    campaign.status === 'live' &&
    campaign.channels.includes('notify') &&
    Boolean(campaign.notification) &&
    (!campaign.startsAt || campaign.startsAt <= now) &&
    (!campaign.endsAt || campaign.endsAt > now);

export const buildCampaignNotification = async (
    campaign: Campaign,
    recipient: LCNNotification['to'],
    campaignTestId?: string
): Promise<LCNNotification> => {
    if (!campaign.notification)
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Campaign has no notification copy' });
    const learnCard = await getDidWebLearnCard();
    return {
        type: 'ANNOUNCEMENT',
        to: {
            did: recipient.did,
            profileId: recipient.profileId,
            ...(recipient.notificationsWebhook
                ? { notificationsWebhook: recipient.notificationsWebhook }
                : {}),
        },
        from: learnCard.id.did(),
        message: campaign.notification,
        data: {
            metadata: {
                campaignId: campaign.id,
                campaignCreatedAt: campaign.createdAt,
                ...(campaignTestId ? { campaignTestId } : {}),
            },
        },
    };
};

export const authorizeCampaignNotification = async (
    notification: LCNNotification
): Promise<boolean> => {
    if (notification.type !== 'ANNOUNCEMENT') return true;
    const metadata = notification.data?.metadata;
    if (!metadata?.campaignId || !metadata.campaignCreatedAt || !notification.to.profileId)
        throw new Error('Campaign delivery is missing its identity');
    // Test jobs were addressed to the authenticated admin by sendTestToMe.
    if (metadata.campaignTestId) return true;
    let campaign: Campaign;
    try {
        campaign = await getCampaign(metadata.campaignId);
    } catch (error) {
        if (error instanceof TRPCError && error.code === 'NOT_FOUND') return false;
        throw error;
    }
    return (
        canDispatchCampaign(campaign) &&
        Boolean(
            await getCampaignDeliveryRecipient(
                metadata.campaignId,
                metadata.campaignCreatedAt,
                notification.to.profileId
            )
        )
    );
};

export const enqueueCampaignNotification = async (notification: LCNNotification): Promise<void> => {
    const result = await addNotificationToQueue(notification, {
        propagateDirectWebhookTransportErrors: true,
        throwOnPermanentFailure: true,
    });
    if (result === false) throw new Error('Campaign notification was not stored');
    // The local fallback returns a storage acknowledgement. SQS only acknowledges enqueue.
    if (result === true) await acknowledgeCampaignNotification(notification);
};

export const sendCampaignTestToMe = async (
    campaignId: string,
    caller: LCNNotification['to']
): Promise<boolean> => {
    const campaign = await getCampaign(campaignId);
    const testId = randomUUID();
    if (campaign.channels.includes('inApp') && !caller.profileId)
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Test requires an administrator profile',
        });
    if (campaign.channels.includes('notify')) {
        await enqueueCampaignNotification(
            await buildCampaignNotification(campaign, caller, testId)
        );
    }
    if (campaign.channels.includes('inApp') && caller.profileId) {
        await queueCampaignInAppTest(campaign, caller.profileId, testId);
    }
    return true;
};
