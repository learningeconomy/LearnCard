import { z } from 'zod';
import type { Campaign } from '@learncard/types';
import { ensureCampaignConstraints } from '../../models/campaign-constraints';
import {
    adultProfilePredicate,
    campaignTimeParams,
    liveCampaignPredicate,
    parseCampaign,
    withCampaignTransaction,
} from './shared';

export type CampaignEmailRecipient = {
    campaign: Campaign;
    email: string;
    unsubscribeId: string;
    locale?: string;
};

/** Reserve before external I/O. A lost acknowledgement remains reserved and is never retried automatically. */
export const claimCampaignEmail = async (
    campaignId: string,
    campaignCreatedAt: string,
    profileId: string,
    test = false,
    prepare?: (recipient: CampaignEmailRecipient) => Promise<void>
): Promise<CampaignEmailRecipient | undefined> => {
    await ensureCampaignConstraints();
    return withCampaignTransaction('campaign:claimEmail', async transaction => {
        const params = { campaignId, campaignCreatedAt, profileId, ...campaignTimeParams() };
        await transaction.run(
            `MATCH (p:Profile {profileId: $profileId})
            SET p.campaignStateLock = coalesce(p.campaignStateLock, 0) + 1,
                p.campaignUnsubscribeId = coalesce(p.campaignUnsubscribeId, randomUUID())`,
            params
        );
        const result = await transaction.run(
            `MATCH (p:Profile {profileId: $profileId}), (c:Campaign {id: $campaignId})
             WHERE c.createdAt = $campaignCreatedAt AND ${adultProfilePredicate}
               AND coalesce(p.announcementEmailOptOut, false) = false
               ${test ? '' : `AND ${liveCampaignPredicate} AND EXISTS { MATCH (p)-[:IN_CAMPAIGN_AUDIENCE]->(c) }`}
             MATCH (p)-[:HAS_CONTACT_METHOD]->(email:ContactMethod)
             WHERE email.type = 'email' AND email.isPrimary = true AND email.isVerified = true
             OPTIONAL MATCH (p)-[state:CAMPAIGN_STATE]->(c)
             WITH p, c, email, state
             ${test ? '' : 'WHERE state.emailClaimedAt IS NULL AND state.emailedAt IS NULL'}
             WITH p, c, email ORDER BY email.id LIMIT 2
             RETURN c.definition AS definition, email.value AS email, p.locale AS locale,
                    p.campaignUnsubscribeId AS unsubscribeId`,
            params
        );
        // Ambiguous primary contacts fail closed, as do malformed legacy addresses.
        if (result.records.length !== 1) return undefined;
        const row = result.records[0]!;
        const campaign = parseCampaign(row.get('definition'));
        const email = z.email().safeParse(row.get('email'));
        if (!email.success || !campaign.channels.includes('email') || !campaign.email)
            return undefined;
        const recipient = {
            campaign,
            email: email.data,
            unsubscribeId: row.get('unsubscribeId') as string,
            locale: row.get('locale') ?? undefined,
        };
        // Local preparation only: no provider send inside a retriable transaction.
        // A render failure aborts before writing the durable claim.
        await prepare?.(recipient);
        if (!test)
            await transaction.run(
                `MATCH (p:Profile {profileId: $profileId}), (c:Campaign {id: $campaignId})
             MERGE (p)-[state:CAMPAIGN_STATE]->(c) SET state.emailClaimedAt = $now`,
                params
            );
        return recipient;
    });
};

/** Provider acceptance only; a claim alone is not an emailed statistic. */
export const acknowledgeCampaignEmail = async (
    campaignId: string,
    campaignCreatedAt: string,
    profileId: string
): Promise<void> => {
    await withCampaignTransaction('campaign:acknowledgeEmail', async transaction => {
        await transaction.run(
            `MATCH (p:Profile {profileId: $profileId})-[state:CAMPAIGN_STATE]->(c:Campaign {id: $campaignId})
             WHERE c.createdAt = $campaignCreatedAt AND state.emailClaimedAt IS NOT NULL
             SET state.emailedAt = coalesce(state.emailedAt, $now)`,
            { campaignId, campaignCreatedAt, profileId, ...campaignTimeParams() }
        );
    });
};
