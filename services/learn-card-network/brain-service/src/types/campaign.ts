import { z } from 'zod';
import { CampaignIdValidator, type CampaignStatus } from '@learncard/types';

export type CampaignRecord = {
    id: string;
    name: string;
    status: CampaignStatus;
    definition: string;
    startsAt?: string;
    endsAt?: string;
    excludeMinors: boolean;
    selfEnroll: boolean;
    createdByProfileId: string;
    createdAt: string;
    updatedAt: string;
};

export type CampaignAudienceQuery = { match: string; params: Record<string, unknown> };

export const CampaignDispatchJobValidator = z
    .object({
        campaignId: CampaignIdValidator,
        campaignCreatedAt: z.iso.datetime(),
        afterProfileId: z.string().optional(),
        dispatchId: z.uuid(),
    })
    .strict();

export type CampaignDispatchJob = z.infer<typeof CampaignDispatchJobValidator>;
