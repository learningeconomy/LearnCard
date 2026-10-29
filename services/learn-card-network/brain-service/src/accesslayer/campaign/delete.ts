import { TRPCError } from '@trpc/server';

import { lockCampaign, withCampaignTransaction } from './shared';

export const deleteCampaign = async (campaignId: string): Promise<boolean> =>
    withCampaignTransaction('campaign:delete', async transaction => {
        const campaign = await lockCampaign(transaction, campaignId);
        if (campaign.status === 'live' || campaign.status === 'paused') {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Archive live or paused campaigns before deleting them',
            });
        }
        await transaction.run('MATCH (c:Campaign {id: $campaignId}) DETACH DELETE c', {
            campaignId,
        });
        return true;
    });
