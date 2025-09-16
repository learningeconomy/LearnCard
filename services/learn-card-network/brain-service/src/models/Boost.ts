import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';
import { BoostPermissions } from '@learncard/types';

import { neogma } from '@instance';

import { Profile, ProfileInstance } from './Profile';
import { FlatBoostType, BoostStatus } from 'types/boost';
import { Role, RoleInstance } from './Role';
import { SkillFramework, SkillFrameworkInstance } from './SkillFramework';
import { Skill, SkillInstance } from './Skill';

export type BoostRelationships = {
    createdBy: ModelRelatedNodesI<
        typeof Profile,
        ProfileInstance,
        { date: string },
        { date: string }
    >;
    parentOf: ModelRelatedNodesI<typeof Boost, BoostInstance>;
    hasRole: ModelRelatedNodesI<
        typeof Profile,
        ProfileInstance,
        Partial<BoostPermissions> & { roleId: string },
        Partial<BoostPermissions> & { roleId: string }
    >;
    claimRole: ModelRelatedNodesI<typeof Role, RoleInstance>;
    usesFramework: ModelRelatedNodesI<typeof SkillFramework, SkillFrameworkInstance>;
    alignedTo: ModelRelatedNodesI<typeof Skill, SkillInstance>;
};

export type BoostInstance = NeogmaInstance<FlatBoostType, BoostRelationships>;

export const Boost = ModelFactory<FlatBoostType, BoostRelationships>(
    {
        label: 'Boost',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            name: { type: 'string', required: false },
            type: { type: 'string', required: false },
            category: { type: 'string', required: false },
            autoConnectRecipients: { type: 'boolean', required: false },
            boost: { type: 'string', required: true },
            status: { type: 'string', enum: BoostStatus.options, required: false },
            allowAnyoneToCreateChildren: { type: 'boolean', required: false },
        },
        primaryKeyField: 'id',
        relationships: {
            createdBy: {
                model: Profile,
                direction: 'out',
                name: 'CREATED_BY',
                properties: {
                    date: { property: 'date', schema: { type: 'string', required: true } },
                },
            },
            parentOf: { model: 'self', direction: 'out', name: 'PARENT_OF' },
            hasRole: {
                model: Profile,
                direction: 'in',
                name: 'HAS_ROLE',
                properties: {
                    roleId: { property: 'roleId', schema: { type: 'string', required: true } },
                    role: { property: 'role', schema: { type: 'string', required: false } },
                    canEdit: { property: 'canEdit', schema: { type: 'boolean', required: false } },
                    canIssue: {
                        property: 'canIssue',
                        schema: { type: 'boolean', required: false },
                    },
                    canRevoke: {
                        property: 'canRevoke',
                        schema: { type: 'boolean', required: false },
                    },
                    canManagePermissions: {
                        property: 'canManagePermissions',
                        schema: { type: 'boolean', required: false },
                    },
                    canIssueChildren: {
                        property: 'canIssueChildren',
                        schema: { type: 'string', required: false },
                    },
                    canCreateChildren: {
                        property: 'canCreateChildren',
                        schema: { type: 'string', required: false },
                    },
                    canEditChildren: {
                        property: 'canEditChildren',
                        schema: { type: 'string', required: false },
                    },
                    canRevokeChildren: {
                        property: 'canRevokeChildren',
                        schema: { type: 'string', required: false },
                    },
                    canManageChildrenPermissions: {
                        property: 'canManageChildrenPermissions',
                        schema: { type: 'string', required: false },
                    },
                    canManageChildrenProfiles: {
                        property: 'canManageChildrenProfiles',
                        schema: { type: 'boolean', required: false },
                    },
                    canViewAnalytics: {
                        property: 'canViewAnalytics',
                        schema: { type: 'boolean', required: false },
                    },
                },
            },
            claimRole: { model: Role, direction: 'out', name: 'CLAIM_ROLE' },
            usesFramework: { model: SkillFramework, direction: 'out', name: 'USES_FRAMEWORK' },
            alignedTo: { model: Skill, direction: 'out', name: 'ALIGNED_TO' },
        },
    },
    neogma
);

export default Boost;
