import { lockCampaign, withCampaignTransaction } from './shared';

export const deleteCampaign = async (campaignId: string): Promise<boolean> =>
    withCampaignTransaction('campaign:delete', async transaction => {
        await lockCampaign(transaction, campaignId);
        await transaction.run('MATCH (c:Campaign {id: $campaignId}) DETACH DELETE c', {
            campaignId,
        });
        return true;
    });
