import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { Profile, ProfileInstance } from './Profile';
import { BoostType, BoostStatus } from 'types/boost';

export type BoostRelationships = {
    createdBy: ModelRelatedNodesI<
        typeof Profile,
        ProfileInstance,
        { date: string },
        { date: string }
    >;
    parentOf: ModelRelatedNodesI<typeof Boost, BoostInstance>;
    hasPermissions: ModelRelatedNodesI<
        typeof Profile,
        ProfileInstance,
        {
            role: string;
            canEdit: boolean;
            canIssue: boolean;
            canRevoke: boolean;
            canManagePermissions: boolean;
            canIssueChildren: string;
            canCreateChildren: string;
            canEditChildren: string;
            canRevokeChildren: string;
            canManageChildrenPermissions: string;
            canViewAnalytics: boolean;
        },
        {
            role: string;
            canEdit: boolean;
            canIssue: boolean;
            canRevoke: boolean;
            canManagePermissions: boolean;
            canIssueChildren: string;
            canCreateChildren: string;
            canEditChildren: string;
            canRevokeChildren: string;
            canManageChildrenPermissions: string;
            canViewAnalytics: boolean;
        }
    >;
};

export type BoostInstance = NeogmaInstance<BoostType, BoostRelationships>;

export const Boost = ModelFactory<BoostType, BoostRelationships>(
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
            hasPermissions: {
                model: 'self',
                direction: 'in',
                name: 'HAS_PERMISSIONS',
                properties: {
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
                    canViewAnalytics: {
                        property: 'canViewAnalytics',
                        schema: { type: 'boolean', required: false },
                    },
                },
            },
        },
    },
    neogma
);

export default Boost;
