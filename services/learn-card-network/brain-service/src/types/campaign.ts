import type { CampaignStatus } from '@learncard/types';

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
