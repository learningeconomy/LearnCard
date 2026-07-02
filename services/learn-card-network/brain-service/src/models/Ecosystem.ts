import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { EcosystemStatusEnum, EcosystemRoleEnum } from '@learncard/types';

import { Profile, ProfileInstance } from './Profile';
import { ProfileManager, ProfileManagerInstance } from './ProfileManager';
import { AppStoreListing, AppStoreListingInstance } from './AppStoreListing';
import { Boost, BoostInstance } from './Boost';
import { Group, GroupInstance } from './Group';
import { FlatEcosystemType } from 'types/ecosystem';

export type EcosystemRelationships = {
    childOf: ModelRelatedNodesI<typeof Ecosystem, EcosystemInstance>;
    memberOf: ModelRelatedNodesI<
        typeof Profile,
        ProfileInstance,
        { role: string },
        { role: string }
    >;
    administratedBy: ModelRelatedNodesI<typeof ProfileManager, ProfileManagerInstance>;
    installs: ModelRelatedNodesI<
        typeof AppStoreListing,
        AppStoreListingInstance,
        { installedAt: string },
        { installedAt: string }
    >;
    endorses: ModelRelatedNodesI<typeof Boost, BoostInstance>;
    owns: ModelRelatedNodesI<typeof Group, GroupInstance>;
    references: ModelRelatedNodesI<
        typeof Group,
        GroupInstance,
        { mode: string; grantedAt: string; grantedByProfileId: string; expiresAt?: string },
        { mode: string; grantedAt: string; grantedByProfileId: string; expiresAt?: string }
    >;
};

export type EcosystemInstance = NeogmaInstance<FlatEcosystemType, EcosystemRelationships>;

export const Ecosystem = ModelFactory<FlatEcosystemType, EcosystemRelationships>(
    {
        label: 'Ecosystem',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            name: { type: 'string', required: true },
            slug: { type: 'string', required: true },
            description: { type: 'string', required: false },
            parentEcosystemId: { type: 'string', required: false },
            pathIds: { type: 'array', items: { type: 'string' }, required: true },
            slugPath: { type: 'array', items: { type: 'string' }, required: true },
            depth: { type: 'number', required: true },
            rootEcosystemId: { type: 'string', required: true },
            ownerProfileId: { type: 'string', required: true },
            settings: { type: 'string', required: false },
            status: { type: 'string', enum: EcosystemStatusEnum.options, required: true },
            createdAt: { type: 'string', required: true },
            updatedAt: { type: 'string', required: true },
        } as any,
        primaryKeyField: 'id',
        relationships: {
            childOf: { model: 'self', direction: 'out', name: 'CHILD_OF' },
            memberOf: {
                model: Profile,
                direction: 'in',
                name: 'MEMBER_OF',
                properties: {
                    role: {
                        property: 'role',
                        schema: { type: 'string', enum: EcosystemRoleEnum.options, required: true },
                    },
                },
            },
            administratedBy: {
                model: ProfileManager,
                direction: 'in',
                name: 'ADMINISTRATES',
            },
            installs: {
                model: AppStoreListing,
                direction: 'out',
                name: 'INSTALLS',
                properties: {
                    installedAt: {
                        property: 'installedAt',
                        schema: { type: 'string', required: true },
                    },
                },
            },
            endorses: { model: Boost, direction: 'out', name: 'ENDORSES' },
        },
    },
    neogma
);

export default Ecosystem;
