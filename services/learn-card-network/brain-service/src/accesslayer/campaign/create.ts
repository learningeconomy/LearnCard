import { TRPCError } from '@trpc/server';
import {
    CampaignValidator,
    CreateCampaignInputValidator,
    type Campaign,
    type CreateCampaignInput,
} from '@learncard/types';

import { neogma } from '@instance';
import { traceDb } from '@tracing';
import { ensureCampaignConstraints } from '../../models/campaign-constraints';
import { campaignProperties } from './shared';

export const createCampaign = async (
    input: CreateCampaignInput,
    createdByProfileId: string
): Promise<Campaign> => {
    const parsed = CreateCampaignInputValidator.parse(input);
    const now = new Date().toISOString();
    const campaign = CampaignValidator.parse({
        ...parsed,
        message: parsed.message ? { ...parsed.message, id: parsed.id } : undefined,
        createdAt: now,
        updatedAt: now,
    });
    await ensureCampaignConstraints();
    try {
        await traceDb('campaign:create', () =>
            neogma.queryRunner.run('CREATE (c:Campaign) SET c = $properties', {
                properties: { ...campaignProperties(campaign), createdByProfileId },
            })
        );
    } catch (error) {
        if (
            (error as { code?: string })?.code ===
            'Neo.ClientError.Schema.ConstraintValidationFailed'
        ) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Campaign ID already exists',
                cause: error,
            });
        }
        throw error;
    }
    return campaign;
};
