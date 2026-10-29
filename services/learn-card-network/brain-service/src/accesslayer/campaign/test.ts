import { CampaignTestValidator, type Campaign, type CampaignTest } from '@learncard/types';
import { TRPCError } from '@trpc/server';
import { neogma } from '@instance';
import { traceDb } from '@tracing';

/** Keep the latest private test per administrator/campaign, without enrolling the administrator. */
export const queueCampaignInAppTest = async (
    campaign: Campaign,
    profileId: string,
    testId: string
): Promise<void> => {
    if (!campaign.message)
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Campaign has no in-app message' });
    const message = { ...campaign.message, id: `campaign-test-${testId}` };
    const result = await traceDb('campaign:queueTest', () =>
        neogma.queryRunner.run(
            `MATCH (p:Profile {profileId: $profileId}), (c:Campaign {id: $campaignId})
             WHERE c.createdAt = $createdAt
             MERGE (p)-[test:CAMPAIGN_TEST]->(c)
             SET test.id = $testId, test.message = $message, test.createdAt = $now
             RETURN test.id AS id`,
            {
                profileId,
                campaignId: campaign.id,
                createdAt: campaign.createdAt,
                testId,
                message: JSON.stringify(message),
                now: new Date().toISOString(),
            }
        )
    );
    if (!result.records.length)
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Campaign or administrator not found' });
};

/** Reading does not consume a test; only a renderer acknowledgement removes it. */
export const getCampaignTests = async (profileId: string): Promise<CampaignTest[]> => {
    const result = await traceDb('campaign:getTests', () =>
        neogma.queryRunner.run(
            `MATCH (p:Profile {profileId: $profileId})-[test:CAMPAIGN_TEST]->(c:Campaign)
             RETURN test.id AS id, c.id AS campaignId, test.message AS message
             ORDER BY test.createdAt, test.id LIMIT 20`,
            { profileId }
        )
    );
    return result.records.map(record =>
        CampaignTestValidator.parse({
            id: record.get('id'),
            campaignId: record.get('campaignId'),
            message: JSON.parse(record.get('message')),
        })
    );
};

/** An acknowledgement of an older snapshot cannot consume a newly queued test. */
export const acknowledgeCampaignTest = async (
    profileId: string,
    campaignId: string,
    testId: string
): Promise<boolean> => {
    await traceDb('campaign:acknowledgeTest', () =>
        neogma.queryRunner.run(
            `MATCH (:Profile {profileId: $profileId})-[test:CAMPAIGN_TEST {id: $testId}]->(:Campaign {id: $campaignId})
             DELETE test`,
            { profileId, campaignId, testId }
        )
    );
    return true;
};
