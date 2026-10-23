import { ModelFactory, type ModelRelatedNodesI, type NeogmaInstance } from 'neogma';

import { neogma } from '@instance';
import type { CampaignRecord } from 'types/campaign';
import type { Profile, ProfileInstance } from './Profile';

export type CampaignRelationships = {
    audience: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
    state: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
};
export type CampaignInstance = NeogmaInstance<CampaignRecord, CampaignRelationships>;

export const Campaign = ModelFactory<CampaignRecord, CampaignRelationships>(
    {
        label: 'Campaign',
        primaryKeyField: 'id',
        schema: {
            id: { type: 'string', required: true },
            name: { type: 'string', required: true },
            status: { type: 'string', required: true },
            definition: { type: 'string', required: true },
            startsAt: { type: 'string', required: false },
            endsAt: { type: 'string', required: false },
            excludeMinors: { type: 'boolean', required: true },
            selfEnroll: { type: 'boolean', required: true },
            createdByProfileId: { type: 'string', required: true },
            createdAt: { type: 'string', required: true },
            updatedAt: { type: 'string', required: true },
        },
    },
    neogma
);
