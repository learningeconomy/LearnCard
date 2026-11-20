import {
    CampaignEmailDeliveryError,
    prepareCampaignEmailDelivery,
    sendCampaignEmail,
} from './campaign-email.helpers';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { TRPCError } from '@trpc/server';
import { CampaignDispatchJobValidator, type CampaignDispatchJob } from 'types/campaign';
import { environment } from '@environment';
import { authorizeConfirmedCampaignDispatch } from '@accesslayer/campaign/dispatch';
import { getCampaign } from '@accesslayer/campaign/read';
import { pageCampaignAudience } from '@accesslayer/campaign/audience';
import { getCampaignDeliveryRecipient } from '@accesslayer/campaign/delivery';
import { trace } from '@tracing';
import {
    buildCampaignNotification,
    canDispatchCampaign,
    enqueueCampaignNotification,
} from './campaign-notifications.helpers';

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

export const dispatchCampaign = async (
    campaignId: string,
    expectedPreviewToken?: string
): Promise<{ dispatchId: string }> => {
    // Keep existing SDK callers compatible; the composer always supplies its reviewed token.
    const campaign = expectedPreviewToken
        ? await authorizeConfirmedCampaignDispatch(campaignId, expectedPreviewToken)
        : await getCampaign(campaignId);
    if (!canDispatchCampaign(campaign))
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Campaign must be live, in its time window, and have a delivery channel',
        });
    const dispatchId = randomUUID();
    if (campaign.channels.includes('email')) await prepareCampaignEmailDelivery();
    for (const channel of ['notify', 'email'] as const) {
        if (campaign.channels.includes(channel))
            await addCampaignDispatchToQueue({
                campaignId,
                campaignCreatedAt: campaign.createdAt,
                dispatchId,
                channel,
            });
    }
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
        if (!campaign.channels.includes(job.channel)) return;
        const emailAdapter =
            job.channel === 'email' ? await prepareCampaignEmailDelivery() : undefined;
        const pageSize =
            job.channel === 'email'
                ? environment.CAMPAIGN_EMAIL_PAGE_SIZE
                : environment.CAMPAIGN_DISPATCH_PAGE_SIZE;
        const page = await pageCampaignAudience(
            job.campaignId,
            job.afterProfileId,
            pageSize,
            job.channel === 'email' ? 'email' : undefined
        );
        for (const { profileId } of page.records) {
            if (job.channel === 'email') {
                try {
                    await sendCampaignEmail(campaign, profileId, false, emailAdapter);
                } catch (error) {
                    // Only post-claim failures can be skipped safely. Configuration,
                    // rendering and database failures retry the page without consuming claims.
                    if (!(error instanceof CampaignEmailDeliveryError)) throw error;
                    console.error('Campaign email delivery failed; reservation retained');
                }
                continue;
            }
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
