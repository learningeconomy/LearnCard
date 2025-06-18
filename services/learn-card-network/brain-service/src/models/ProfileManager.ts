import { ModelFactory, type ModelRelatedNodesI, type NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { Profile, type ProfileInstance } from './Profile';
import { Boost, type BoostInstance } from './Boost';

import type { ProfileManagerType } from 'types/profile-manager';

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
            created: { type: 'string', required: true },
            displayName: { type: 'string', required: false },
            shortBio: { type: 'string', required: false },
            bio: { type: 'string', required: false },
            email: { type: 'string', required: false },
            image: { type: 'string', required: false },
            heroImage: { type: 'string', required: false },
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
