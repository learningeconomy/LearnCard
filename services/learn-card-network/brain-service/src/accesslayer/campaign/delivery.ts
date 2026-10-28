import type { LCNNotification } from '@learncard/types';
import { neogma } from '@instance';
import { traceDb } from '@tracing';
import type { ProfileType } from 'types/profile';
import {
    campaignAgePredicate,
    campaignTimeParams,
    liveCampaignPredicate,
    parseCampaign,
    withCampaignTransaction,
} from './shared';

/** Recheck eligibility at enqueue and delivery time; queued work can outlive a pause. */
export const getCampaignDeliveryRecipient = async (
    campaignId: string,
    campaignCreatedAt: string,
    profileId: string
): Promise<ProfileType | undefined> => {
    const result = await traceDb('campaign:deliveryRecipient', () =>
        neogma.queryRunner.run(
            `MATCH (p:Profile {profileId: $profileId})-[:IN_CAMPAIGN_AUDIENCE]->(c:Campaign {id: $campaignId})
             WHERE c.createdAt = $campaignCreatedAt AND ${liveCampaignPredicate}
               AND ${campaignAgePredicate}
             OPTIONAL MATCH (p)-[state:CAMPAIGN_STATE]->(c)
             WITH p, state WHERE state.notifiedAt IS NULL
             RETURN properties(p) AS profile, c.definition AS definition`,
            { campaignId, campaignCreatedAt, profileId, ...campaignTimeParams() }
        )
    );
    const row = result.records[0];
    if (!row || !parseCampaign(row.get('definition')).channels.includes('notify')) return undefined;
    return row.get('profile') as ProfileType;
};

/** Only durable inbox acknowledgement counts as notified; enqueueing alone does not. */
export const acknowledgeCampaignNotification = async (
    notification: LCNNotification
): Promise<void> => {
    const metadata = notification.data?.metadata;
    if (notification.type !== 'ANNOUNCEMENT' || metadata?.campaignTestId) return;
    if (!metadata?.campaignId || !metadata.campaignCreatedAt || !notification.to.profileId)
        throw new Error('Campaign delivery is missing its identity');

    await withCampaignTransaction('campaign:acknowledgeNotification', async transaction => {
        const params = {
            campaignId: metadata.campaignId,
            campaignCreatedAt: metadata.campaignCreatedAt,
            profileId: notification.to.profileId,
            ...campaignTimeParams(),
        };
        // Use the same profile lock as engagement writes to keep one state relationship.
        await transaction.run(
            `MATCH (p:Profile {profileId: $profileId})
             SET p.campaignStateLock = coalesce(p.campaignStateLock, 0) + 1`,
            params
        );
        await transaction.run(
            `MATCH (p:Profile {profileId: $profileId})-[:IN_CAMPAIGN_AUDIENCE]->(c:Campaign {id: $campaignId})
             WHERE c.createdAt = $campaignCreatedAt
             MERGE (p)-[state:CAMPAIGN_STATE]->(c)
             SET state.notifiedAt = coalesce(state.notifiedAt, $now)`,
            params
        );
    });
};
