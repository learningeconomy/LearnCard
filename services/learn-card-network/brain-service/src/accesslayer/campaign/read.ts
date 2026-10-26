import { TRPCError } from '@trpc/server';
import { int, isInt } from 'neo4j-driver';
import {
    CampaignUserStateValidator,
    type Campaign,
    type CampaignStats,
    type ListCampaignsInput,
    type MyCampaign,
    type PaginatedCampaigns,
} from '@learncard/types';

import { neogma } from '@instance';
import { traceDb } from '@tracing';
import {
    campaignAgePredicate,
    campaignTimeParams,
    liveCampaignPredicate,
    parseCampaign,
    safeParseCampaign,
} from './shared';

export const getCampaign = async (campaignId: string): Promise<Campaign> => {
    const result = await traceDb('campaign:get', () =>
        neogma.queryRunner.run(
            'MATCH (c:Campaign {id: $campaignId}) RETURN c.definition AS definition',
            { campaignId }
        )
    );
    if (!result.records.length)
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Campaign not found' });
    return parseCampaign(result.records[0]!.get('definition'));
};

export const listCampaigns = async ({
    cursor,
    limit = 100,
    status,
}: ListCampaignsInput): Promise<PaginatedCampaigns> => {
    const result = await traceDb('campaign:list', () =>
        neogma.queryRunner.run(
            `MATCH (c:Campaign) WHERE ($cursor IS NULL OR c.id > $cursor)
         AND ($status IS NULL OR c.status = $status)
         RETURN c.definition AS definition ORDER BY c.id LIMIT $limit`,
            { cursor: cursor ?? null, status: status ?? null, limit: int(limit + 1) }
        )
    );
    const rows = result.records.map(record => parseCampaign(record.get('definition')));
    const hasMore = rows.length > limit;
    const records = rows.slice(0, limit);
    return { records, hasMore, cursor: hasMore ? records.at(-1)?.id : undefined };
};

export const getLiveCampaignsForProfile = async (
    profileId: string,
    now = new Date()
): Promise<MyCampaign[]> => {
    const result = await traceDb('campaign:getMyCampaigns', () =>
        neogma.queryRunner.run(
            `MATCH (p:Profile {profileId: $profileId}), (c:Campaign)
         WHERE ${liveCampaignPredicate} AND ${campaignAgePredicate}
           AND (c.selfEnroll = true OR EXISTS { MATCH (p)-[:IN_CAMPAIGN_AUDIENCE]->(c) })
         OPTIONAL MATCH (p)-[state:CAMPAIGN_STATE]->(c)
         RETURN c.id AS campaignId, c.definition AS definition, properties(state) AS state
         ORDER BY c.id`,
            { profileId, ...campaignTimeParams(now) }
        )
    );
    return result.records.flatMap(record => {
        const campaign = safeParseCampaign(record.get('definition'));
        if (!campaign) {
            console.warn('campaign:getMyCampaigns skipped invalid stored definition', {
                campaignId: record.get('campaignId'),
            });
            return [];
        }
        if (!campaign.channels.includes('inApp') || !campaign.message.enabled) return [];
        const state = Object.fromEntries(
            Object.entries(record.get('state') ?? {}).map(([key, value]) => [
                key,
                isInt(value) ? value.toNumber() : value,
            ])
        );
        return [
            {
                campaign: {
                    id: campaign.id,
                    message: campaign.message,
                    startsAt: campaign.startsAt,
                    endsAt: campaign.endsAt,
                    selfEnroll: campaign.selfEnroll,
                },
                state: CampaignUserStateValidator.parse(state),
            },
        ];
    });
};

export const getCampaignStats = async (campaignId: string): Promise<CampaignStats> => {
    await getCampaign(campaignId);
    const result = await traceDb('campaign:stats', () =>
        neogma.queryRunner.run(
            `MATCH (c:Campaign {id: $campaignId})
         OPTIONAL MATCH (p:Profile)-[audience:IN_CAMPAIGN_AUDIENCE]->(c)
         OPTIONAL MATCH (p)-[state:CAMPAIGN_STATE]->(c)
         RETURN count(DISTINCT p) AS audience,
           count(DISTINCT CASE WHEN audience.source = 'selfEnrolled' THEN p END) AS enrolled,
           count(DISTINCT CASE WHEN state.notifiedAt IS NOT NULL THEN p END) AS notified,
           count(DISTINCT CASE WHEN state.firstShownAt IS NOT NULL THEN p END) AS shown,
           count(DISTINCT CASE WHEN state.clickedAt IS NOT NULL THEN p END) AS clicked,
           count(DISTINCT CASE WHEN state.dismissedAt IS NOT NULL THEN p END) AS dismissed,
           count(DISTINCT CASE WHEN state.convertedAt IS NOT NULL THEN p END) AS converted`,
            { campaignId }
        )
    );
    const record = result.records[0]!;
    return {
        audience: record.get('audience').toNumber(),
        enrolled: record.get('enrolled').toNumber(),
        notified: record.get('notified').toNumber(),
        shown: record.get('shown').toNumber(),
        clicked: record.get('clicked').toNumber(),
        dismissed: record.get('dismissed').toNumber(),
        converted: record.get('converted').toNumber(),
    };
};
