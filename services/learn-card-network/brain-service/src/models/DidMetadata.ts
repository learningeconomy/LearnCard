import { ModelFactory, type ModelRelatedNodesI, type NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { Profile, type ProfileInstance } from './Profile';
import type { FlatDidMetadataType } from 'types/did-metadata';

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
