import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import {
    EcosystemStatusEnum,
    GroupTypeEnum,
    GroupMembershipModeEnum,
    GroupMembershipProvenanceEnum,
} from '@learncard/types';

import { Profile, ProfileInstance } from './Profile';
import { ProfileManager, ProfileManagerInstance } from './ProfileManager';
import { FlatGroupType } from 'types/group';

export type GroupRelationships = {
    childOf: ModelRelatedNodesI<typeof Group, GroupInstance>;
    memberOfGroup: ModelRelatedNodesI<typeof Group, GroupInstance>;
    hasMemberProfile: ModelRelatedNodesI<
        typeof Profile,
        ProfileInstance,
        { provenance: string; joinedAt: string },
        { provenance: string; joinedAt: string }
    >;
    hasIdentity: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
    administratedBy: ModelRelatedNodesI<typeof ProfileManager, ProfileManagerInstance>;
};

export type GroupInstance = NeogmaInstance<FlatGroupType, GroupRelationships>;

export const Group = ModelFactory<FlatGroupType, GroupRelationships>(
    {
        label: 'Group',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            name: { type: 'string', required: true },
            slug: { type: 'string', required: true },
            type: { type: 'string', enum: GroupTypeEnum.options, required: true },
            description: { type: 'string', required: false },
            parentGroupId: { type: 'string', required: false },
            pathIds: { type: 'string', required: true },
            depth: { type: 'number', required: true },
            rootGroupId: { type: 'string', required: true },
            ownerEcosystemId: { type: 'string', required: true },
            identityProfileId: { type: 'string', required: false },
            membershipMode: {
                type: 'string',
                enum: GroupMembershipModeEnum.options,
                required: true,
            },
            computedCriteria: { type: 'string', required: false },
            status: { type: 'string', enum: EcosystemStatusEnum.options, required: true },
            createdAt: { type: 'string', required: true },
            updatedAt: { type: 'string', required: true },
        } as any,
        primaryKeyField: 'id',
        relationships: {
            childOf: { model: 'self', direction: 'out', name: 'CHILD_OF' },
            memberOfGroup: { model: 'self', direction: 'out', name: 'MEMBER_OF' },
            hasMemberProfile: {
                model: Profile,
                direction: 'in',
                name: 'MEMBER_OF',
                properties: {
                    provenance: {
                        property: 'provenance',
                        schema: {
                            type: 'string',
                            enum: GroupMembershipProvenanceEnum.options,
                            required: true,
                        },
                    },
                    joinedAt: {
                        property: 'joinedAt',
                        schema: { type: 'string', required: true },
                    },
                },
            },
            hasIdentity: { model: Profile, direction: 'out', name: 'HAS_IDENTITY' },
            administratedBy: {
                model: ProfileManager,
                direction: 'in',
                name: 'ADMINISTRATES',
            },
        },
    },
    neogma
);

export default Group;
