import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { Profile, ProfileInstance } from './Profile';
import { FlatDidMetadataType } from 'types/did-metadata';

export type DidMetadataRelationships = {
    associatedWith: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
};

export type DidMetadataInstance = NeogmaInstance<FlatDidMetadataType, DidMetadataRelationships>;

export const DidMetadata = ModelFactory<FlatDidMetadataType, DidMetadataRelationships>(
    {
        label: 'Profile',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
        },
        relationships: {
            associatedWith: { model: Profile, direction: 'out', name: 'ASSOCIATED_WITH' },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default DidMetadata;
