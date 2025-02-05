import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';
import { ClaimHook as ClaimHookType } from 'types/claim-hook';
import Boost, { BoostInstance } from './Boost';
import Role, { RoleInstance } from './Role';

export type ClaimHookRelationships = {
    hookFor: ModelRelatedNodesI<typeof Boost, BoostInstance>;
    target: ModelRelatedNodesI<typeof Boost, BoostInstance>;
    roleToGrant: ModelRelatedNodesI<typeof Role, RoleInstance>;
};

export type ClaimHookInstance = NeogmaInstance<ClaimHookType, ClaimHookRelationships>;

export const ClaimHook = ModelFactory<ClaimHookType, ClaimHookRelationships>(
    {
        label: 'ClaimHook',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            type: { type: 'string', required: true },
            createdAt: { type: 'string', required: true },
            updatedAt: { type: 'string', required: true },
        },
        primaryKeyField: 'id',
        relationships: {
            hookFor: { model: Boost, direction: 'out', name: 'HOOK_FOR' },
            target: { model: Boost, direction: 'out', name: 'TARGET' },
            roleToGrant: { model: Role, direction: 'out', name: 'ROLE_TO_GRANT' },
        },
    },
    neogma
);

export default ClaimHook;
