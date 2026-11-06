import { z } from 'zod';
import { createHash } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { int, type ManagedTransaction } from 'neo4j-driver';
import type { Campaign, CampaignDispatchPreview } from '@learncard/types';
import { neogma } from '@instance';
import { traceDb } from '@tracing';
import { canDispatchCampaign } from '@helpers/campaign-notifications.helpers';
import {
    campaignAgePredicate,
    adultProfilePredicate,
    campaignTimeParams,
    parseCampaign,
    withCampaignTransaction,
} from './shared';

export const MAX_CONFIRMED_DISPATCH_RECIPIENTS = 10_000;

/** Review eligible inbox and email recipients using the delivery predicates. */
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
            AND coalesce(p.announcementPushOptOut, false) = false
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
    const recipients =
        campaign.channels.includes('notify') && campaign.notification
            ? (row.get('recipients') as string[])
            : [];
    let emailRecipients: { profileId: string; email: string }[] = [];
    if (campaign.channels.includes('email') && campaign.email) {
        // Match claimCampaignEmail: adults, opt-in, one verified primary contact,
        // and no previous claim/acceptance. Include the address in the review digest.
        const emailQuery = `MATCH (p:Profile)-[:IN_CAMPAIGN_AUDIENCE]->(c:Campaign {id: $campaignId})
            WHERE ${adultProfilePredicate} AND coalesce(p.announcementEmailOptOut, false) = false
            OPTIONAL MATCH (p)-[state:CAMPAIGN_STATE]->(c)
            WITH p, state WHERE state.emailClaimedAt IS NULL AND state.emailedAt IS NULL
            MATCH (p)-[:HAS_CONTACT_METHOD]->(email:ContactMethod)
            WHERE email.type = 'email' AND email.isPrimary = true AND email.isVerified = true
            WITH p, collect(email) AS emails WHERE size(emails) = 1
            RETURN p.profileId AS profileId, emails[0].value AS email LIMIT $recipientLimit`;
        const emails = await (transaction
            ? transaction.run(emailQuery, params)
            : neogma.queryRunner.run(emailQuery, params));
        if (emails.records.length > MAX_CONFIRMED_DISPATCH_RECIPIENTS)
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Reduce the email audience and preview again',
            });
        emailRecipients = emails.records
            .map(record => ({
                profileId: record.get('profileId') as string,
                email: record.get('email') as string,
            }))
            .filter(recipient => z.email().safeParse(recipient.email).success)
            .sort((a, b) => a.profileId.localeCompare(b.profileId));
    }
    // Bound collection in Cypher before transferring or sorting IDs. Never authorize a partial set.
    if (recipients.length > MAX_CONFIRMED_DISPATCH_RECIPIENTS)
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Confirmed dispatch supports at most ${MAX_CONFIRMED_DISPATCH_RECIPIENTS} eligible recipients; reduce the audience and preview again`,
        });
    recipients.sort();
    let blockedReason: CampaignDispatchPreview['blockedReason'];
    const recipientCount = new Set([...recipients, ...emailRecipients.map(item => item.profileId)])
        .size;
    if (recipientCount > MAX_CONFIRMED_DISPATCH_RECIPIENTS)
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Reduce the audience and preview again',
        });
    if (!canDispatchCampaign(campaign, params.now)) {
        blockedReason =
            campaign.status !== 'live'
                ? 'not_live'
                : !(
                        (campaign.channels.includes('notify') && campaign.notification) ||
                        (campaign.channels.includes('email') && campaign.email)
                    )
                  ? 'notify_disabled'
                  : campaign.startsAt && campaign.startsAt > params.now
                    ? 'not_started'
                    : 'ended';
    } else if (!recipientCount) blockedReason = 'no_recipients';
    // A digest avoids exposing recipient identities and detects equal-count membership swaps.
    // Revision changes on audience edits, definition changes, or a confirmed dispatch.
    const previewToken = createHash('sha256')
        .update(
            JSON.stringify({
                definition: row.get('definition'),
                revision: row.get('revision').toString(),
                recipients,
                emailRecipients,
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
            recipientCount: blockedReason ? 0 : recipientCount,
            notificationRecipientCount: blockedReason ? 0 : recipients.length,
            emailRecipientCount: blockedReason ? 0 : emailRecipients.length,
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
