import { TRPCError } from '@trpc/server';
import {
    CampaignValidator,
    UpdateCampaignInputValidator,
    type Campaign,
    type UpdateCampaignInput,
} from '@learncard/types';

import {
    assertCampaignEditable,
    campaignProperties,
    lockCampaign,
    withCampaignTransaction,
} from './shared';

export const updateCampaign = async (input: UpdateCampaignInput): Promise<Campaign> => {
    const { campaignId, updates, expectedUpdatedAt } = UpdateCampaignInputValidator.parse(input);
    return withCampaignTransaction('campaign:update', async transaction => {
        const existing = await lockCampaign(transaction, campaignId);
        if (expectedUpdatedAt !== undefined && expectedUpdatedAt !== existing.updatedAt) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Campaign changed since it was loaded. Reload before saving.',
            });
        }
        assertCampaignEditable(existing);
        const message = updates.message ?? existing.message;
        const result = CampaignValidator.safeParse({
            ...existing,
            ...updates,
            id: campaignId,
            message: { ...message, id: campaignId },
            notification:
                updates.notification === null
                    ? undefined
                    : (updates.notification ?? existing.notification),
            email: updates.email === null ? undefined : (updates.email ?? existing.email),
            startsAt:
                updates.startsAt === null ? undefined : (updates.startsAt ?? existing.startsAt),
            endsAt: updates.endsAt === null ? undefined : (updates.endsAt ?? existing.endsAt),
            // Every successful write must invalidate a loaded revision, even within one millisecond.
            updatedAt: new Date(
                Math.max(Date.now(), Date.parse(existing.updatedAt) + 1)
            ).toISOString(),
        });
        if (!result.success)
            throw new TRPCError({ code: 'BAD_REQUEST', message: result.error.message });
        if (existing.status !== 'draft' && result.data.status === 'draft') {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Campaign status cannot transition from ${existing.status} to draft`,
            });
        }
        await transaction.run('MATCH (c:Campaign {id: $campaignId}) SET c += $properties', {
            campaignId,
            properties: campaignProperties(result.data),
        });
        return result.data;
    });
};
