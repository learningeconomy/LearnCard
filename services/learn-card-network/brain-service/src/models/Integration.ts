import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { Profile, ProfileInstance } from './Profile';
import { FlatIntegrationType } from 'types/integration';

export type IntegrationRelationships = {
    createdBy: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
    publishesListing: ModelRelatedNodesI<any, any>;
};

export type IntegrationInstance = NeogmaInstance<FlatIntegrationType, IntegrationRelationships>;

export const Integration = ModelFactory<FlatIntegrationType, IntegrationRelationships>(
    {
        label: 'Integration',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            name: { type: 'string', required: true },
            description: { type: 'string', required: false },
            publishableKey: { type: 'string', required: true },
            whitelistedDomains: { type: 'string[]', required: false },

            // Setup/onboarding status
            status: { type: 'string', required: false },
            guideType: { type: 'string', required: false },
            guideState: { type: 'string', required: false }, // JSON stringified

            // Timestamps
            createdAt: { type: 'string', required: false },
            updatedAt: { type: 'string', required: false },
        } as any,
        relationships: {
            createdBy: { model: Profile, direction: 'out', name: 'CREATED_BY' },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default Integration;
