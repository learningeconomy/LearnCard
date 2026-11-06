import { TRPCError } from '@trpc/server';
import { CampaignEventValidator, type CampaignEvent } from '@learncard/types';

import {
    adultProfilePredicate,
    campaignAgePredicate,
    campaignTimeParams,
    liveCampaignPredicate,
    lockCampaign,
    withCampaignTransaction,
} from './shared';

export const enrollInCampaign = async (profileId: string, campaignId: string): Promise<boolean> =>
    withCampaignTransaction('campaign:enroll', async transaction => {
        const campaign = await lockCampaign(transaction, campaignId);
        const params = campaignTimeParams();
        if (
            !campaign.selfEnroll ||
            campaign.status !== 'live' ||
            !campaign.message?.enabled ||
            !campaign.channels.includes('inApp') ||
            (campaign.startsAt && campaign.startsAt > params.now) ||
            (campaign.endsAt && campaign.endsAt <= params.now)
        ) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Campaign is not accepting enrollment',
            });
        }
        const result = await transaction.run(
            `MATCH (p:Profile {profileId: $profileId}), (c:Campaign {id: $campaignId})
             WHERE ${adultProfilePredicate}
             MERGE (p)-[audience:IN_CAMPAIGN_AUDIENCE]->(c)
             ON CREATE SET audience.addedAt = $now, audience.source = 'selfEnrolled'
             RETURN p.profileId AS profileId`,
            { profileId, campaignId, ...params }
        );
        if (!result.records.length)
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Profile is not eligible for enrollment',
            });
        return true;
    });

export const recordCampaignEvent = async (
    profileId: string,
    campaignId: string,
    rawEvent: CampaignEvent
): Promise<boolean> => {
    const event = CampaignEventValidator.parse(rawEvent);
    const assignments: Record<CampaignEvent, string> = {
        shown: `state.firstShownAt = coalesce(state.firstShownAt, $now), state.lastShownAt = $now,
                state.shownCount = coalesce(state.shownCount, 0) + 1`,
        clicked: 'state.clickedAt = $now',
        dismissed: 'state.dismissedAt = $now',
        converted: 'state.convertedAt = $now',
    };
    return withCampaignTransaction('campaign:recordEvent', async transaction => {
        const params = { profileId, campaignId, ...campaignTimeParams() };
        // A profile lock prevents concurrent devices from creating duplicate state edges
        // or losing shown increments, without locking the entire campaign audience.
        const locked = await transaction.run(
            `MATCH (p:Profile {profileId: $profileId})-[:IN_CAMPAIGN_AUDIENCE]->(c:Campaign {id: $campaignId})
             WHERE ${liveCampaignPredicate} AND ${campaignAgePredicate}
             SET p.campaignStateLock = coalesce(p.campaignStateLock, 0) + 1
             RETURN p.profileId AS profileId`,
            params
        );
        if (!locked.records.length) return false;
        const result = await transaction.run(
            `MATCH (p:Profile {profileId: $profileId})-[:IN_CAMPAIGN_AUDIENCE]->(c:Campaign {id: $campaignId})
             WHERE ${liveCampaignPredicate} AND ${campaignAgePredicate}
             MERGE (p)-[state:CAMPAIGN_STATE]->(c) SET ${assignments[event]}
             RETURN state`,
            params
        );
        return result.records.length > 0;
    });
};
