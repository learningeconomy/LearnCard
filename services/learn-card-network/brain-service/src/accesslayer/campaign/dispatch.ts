import { createHash } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { int, type ManagedTransaction } from 'neo4j-driver';
import type { Campaign, CampaignDispatchPreview } from '@learncard/types';
import { neogma } from '@instance';
import { traceDb } from '@tracing';
import { canDispatchCampaign } from '@helpers/campaign-notifications.helpers';
import {
    campaignAgePredicate,
    campaignTimeParams,
    parseCampaign,
    withCampaignTransaction,
} from './shared';

export const MAX_CONFIRMED_DISPATCH_RECIPIENTS = 10_000;

/** Count the same eligible, not-yet-notified audience used at delivery time. */
const readPreview = async (
    campaignId: string,
    transaction?: ManagedTransaction
): Promise<{ campaign: Campaign; preview: CampaignDispatchPreview }> => {
    const params = {
        campaignId,
        ...campaignTimeParams(),
        recipientLimit: int(MAX_CONFIRMED_DISPATCH_RECIPIENTS + 1),
    };
    const query = `MATCH (c:Campaign {id: $campaignId})
        OPTIONAL MATCH (p:Profile)-[:IN_CAMPAIGN_AUDIENCE]->(c)
        OPTIONAL MATCH (p)-[state:CAMPAIGN_STATE]->(c)
        WITH c, count(DISTINCT p) AS audience,
          count(DISTINCT CASE WHEN state.notifiedAt IS NOT NULL THEN p END) AS notified
        CALL {
          WITH c
          MATCH (p:Profile)-[:IN_CAMPAIGN_AUDIENCE]->(c)
          OPTIONAL MATCH (p)-[state:CAMPAIGN_STATE]->(c)
          WITH c, p, state WHERE ${campaignAgePredicate} AND state.notifiedAt IS NULL
          WITH DISTINCT p.profileId AS profileId LIMIT $recipientLimit
          RETURN collect(profileId) AS recipients
        }
        RETURN c.definition AS definition, coalesce(c.lockVersion, 0) AS revision,
          audience, notified, recipients`;
    const result = await traceDb('campaign:dispatchPreview', () =>
        transaction ? transaction.run(query, params) : neogma.queryRunner.run(query, params)
    );
    const row = result.records[0];
    if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Campaign not found' });
    const campaign = parseCampaign(row.get('definition'));
    const recipients = row.get('recipients') as string[];
    // Bound collection in Cypher before transferring or sorting IDs. Never authorize a partial set.
    if (recipients.length > MAX_CONFIRMED_DISPATCH_RECIPIENTS)
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Confirmed dispatch supports at most ${MAX_CONFIRMED_DISPATCH_RECIPIENTS} eligible recipients; reduce the audience and preview again`,
        });
    recipients.sort();
    let blockedReason: CampaignDispatchPreview['blockedReason'];
    if (!canDispatchCampaign(campaign, params.now)) {
        blockedReason =
            campaign.status !== 'live'
                ? 'not_live'
                : !campaign.channels.includes('notify') || !campaign.notification
                  ? 'notify_disabled'
                  : campaign.startsAt && campaign.startsAt > params.now
                    ? 'not_started'
                    : 'ended';
    } else if (!recipients.length) blockedReason = 'no_recipients';
    // A digest avoids exposing recipient identities and detects equal-count membership swaps.
    // Revision changes on audience edits, definition changes, or a confirmed dispatch.
    const previewToken = createHash('sha256')
        .update(
            JSON.stringify({
                definition: row.get('definition'),
                revision: row.get('revision').toString(),
                recipients,
                blockedReason,
            })
        )
        .digest('hex');
    return {
        campaign,
        preview: {
            campaignId,
            audienceCount: row.get('audience').toNumber(),
            alreadyNotifiedCount: row.get('notified').toNumber(),
            recipientCount: blockedReason ? 0 : recipients.length,
            previewToken,
            ...(blockedReason ? { blockedReason } : {}),
        },
    };
};

export const getCampaignDispatchPreview = async (
    campaignId: string
): Promise<CampaignDispatchPreview> => (await readPreview(campaignId)).preview;

/** Recheck and consume a confirmation once, serialized with campaign/audience edits. */
export const authorizeConfirmedCampaignDispatch = async (
    campaignId: string,
    expectedPreviewToken: string
): Promise<Campaign> =>
    withCampaignTransaction('campaign:confirmDispatch', async transaction => {
        // Acquire the same node write lock as campaign/audience edits without changing their revision yet.
        await transaction.run(
            `MATCH (c:Campaign {id: $campaignId})
        SET c.dispatchCheckLock = coalesce(c.dispatchCheckLock, 0) + 1`,
            { campaignId }
        );
        const { campaign, preview } = await readPreview(campaignId, transaction);
        if (preview.previewToken !== expectedPreviewToken)
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Campaign or recipients changed; preview again',
            });
        if (preview.blockedReason)
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Campaign has no eligible notification recipients now',
            });
        await transaction.run(
            `MATCH (c:Campaign {id: $campaignId})
        SET c.lockVersion = coalesce(c.lockVersion, 0) + 1`,
            { campaignId }
        );
        return campaign;
    });
