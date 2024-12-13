import { ModelFactory, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';
import { Role as RoleType } from 'types/role';

export type RoleRelationships = {};

export type RoleInstance = NeogmaInstance<RoleType, RoleRelationships>;

export const Role = ModelFactory<RoleType, RoleRelationships>(
    {
        label: 'Role',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            role: { type: 'string', required: false },
            canEdit: { type: 'boolean', required: false },
            canIssue: { type: 'boolean', required: false },
            canRevoke: { type: 'boolean', required: false },
            canManagePermissions: { type: 'boolean', required: false },
            canIssueChildren: { type: 'string', required: false },
            canCreateChildren: { type: 'string', required: false },
            canEditChildren: { type: 'string', required: false },
            canRevokeChildren: { type: 'string', required: false },
            canManageChildrenPermissions: { type: 'string', required: false },
            canManageChildrenProfiles: { type: 'string', required: false },
            canViewAnalytics: { type: 'boolean', required: false },
        },
        primaryKeyField: 'id',
        relationships: {},
    },
    neogma
);

export default Role;
