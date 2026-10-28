import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { CampaignIdValidator } from '@learncard/types';
import { environment } from '@environment';
import { getCampaign } from '@accesslayer/campaign/read';
import { pageCampaignAudience } from '@accesslayer/campaign/audience';
import { getCampaignDeliveryRecipient } from '@accesslayer/campaign/delivery';
import { trace } from '@tracing';
import {
    buildCampaignNotification,
    canDispatchCampaign,
    enqueueCampaignNotification,
} from './campaign-notifications.helpers';

export const CampaignDispatchJobValidator = z
    .object({
        campaignId: CampaignIdValidator,
        campaignCreatedAt: z.iso.datetime(),
        afterProfileId: z.string().optional(),
        dispatchId: z.uuid(),
    })
    .strict();

export type CampaignDispatchJob = z.infer<typeof CampaignDispatchJobValidator>;

const sqs = new SQSClient({ region: environment.AWS_REGION || 'us-east-1' });

/** Local fallback is awaited, including delays; use SQS for durable production waves. */
export const addCampaignDispatchToQueue = async (
    rawJob: CampaignDispatchJob,
    delaySeconds = 0
): Promise<void> => {
    const job = CampaignDispatchJobValidator.parse(rawJob);
    if (environment.IS_OFFLINE || !environment.CAMPAIGN_QUEUE_URL) {
        if (delaySeconds) await delay(delaySeconds * 1000);
        await processCampaignDispatchJob(job);
        return;
    }
    await sqs.send(
        new SendMessageCommand({
            QueueUrl: environment.CAMPAIGN_QUEUE_URL,
            MessageBody: JSON.stringify(job),
            DelaySeconds: delaySeconds,
        })
    );
};

export const dispatchCampaign = async (campaignId: string): Promise<{ dispatchId: string }> => {
    const campaign = await getCampaign(campaignId);
    if (!canDispatchCampaign(campaign))
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Campaign must be live, in its time window, and have the notify channel',
        });
    const dispatchId = randomUUID();
    await addCampaignDispatchToQueue({
        campaignId,
        campaignCreatedAt: campaign.createdAt,
        dispatchId,
    });
    return { dispatchId };
};

export const processCampaignDispatchJob = async (rawJob: CampaignDispatchJob): Promise<void> =>
    trace('worker', 'campaign:dispatch', async () => {
        const job = CampaignDispatchJobValidator.parse(rawJob);
        let campaign;
        try {
            campaign = await getCampaign(job.campaignId);
        } catch (error) {
            if (error instanceof TRPCError && error.code === 'NOT_FOUND') return;
            throw error;
        }
        if (campaign.createdAt !== job.campaignCreatedAt || !canDispatchCampaign(campaign)) return;
        const pageSize = environment.CAMPAIGN_DISPATCH_PAGE_SIZE;
        const page = await pageCampaignAudience(job.campaignId, job.afterProfileId, pageSize);
        for (const { profileId } of page.records) {
            const recipient = await getCampaignDeliveryRecipient(
                job.campaignId,
                job.campaignCreatedAt,
                profileId
            );
            if (!recipient) continue;
            await enqueueCampaignNotification(await buildCampaignNotification(campaign, recipient));
        }
        if (page.records.length === pageSize) {
            await addCampaignDispatchToQueue(
                { ...job, afterProfileId: page.records.at(-1)!.profileId },
                environment.CAMPAIGN_DISPATCH_DELAY_SECONDS
            );
        }
    });
