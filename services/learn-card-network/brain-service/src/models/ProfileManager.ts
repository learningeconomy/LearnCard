import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { Profile, ProfileInstance } from './Profile';
import { Boost, BoostInstance } from './Boost';

import { ProfileManager as ProfileManagerType } from 'types/profile-manager';

export type ProfileManagerRelationships = {
    manages: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
    childOf: ModelRelatedNodesI<typeof Boost, BoostInstance>;
    administratedBy: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
};

export type ProfileManagerInstance = NeogmaInstance<
    ProfileManagerType,
    ProfileManagerRelationships
>;

export const ProfileManager = ModelFactory<ProfileManagerType, ProfileManagerRelationships>(
    {
        label: 'ProfileManager',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            alternateIds: { type: 'array', required: false },
        },
        primaryKeyField: 'id',
        relationships: {
            manages: { model: Profile, direction: 'out', name: 'MANAGES' },
            childOf: { model: Boost, direction: 'out', name: 'CHILD_OF' },
            administratedBy: { model: Profile, direction: 'out', name: 'ADMINISTRATED_BY' },
        },
    },
    neogma
);

export default ProfileManager;
