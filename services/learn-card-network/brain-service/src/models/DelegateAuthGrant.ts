import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';
import type { DelegateAuthGrant as DelegateAuthGrantRecord } from '@helpers/delegate-auth-grant.schema';

import { Profile, ProfileInstance } from './Profile';

// The schema forbids `actAs` on a delegate grant, so the node has no such property.
export type DelegateAuthGrantProperties = Omit<DelegateAuthGrantRecord, 'actAs'>;

export type DelegateAuthGrantRelationships = {
    authorizesDelegateGrant: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
};

export type DelegateAuthGrantInstance = NeogmaInstance<
    DelegateAuthGrantProperties,
    DelegateAuthGrantRelationships
>;

// A label and a relationship of its own: no query written for `AuthGrant` nodes or
// `AUTHORIZES_AUTH_GRANT` links can see, change or delete a delegate grant.
export const DelegateAuthGrant = ModelFactory<
    DelegateAuthGrantProperties,
    DelegateAuthGrantRelationships
>(
    {
        label: 'DelegateAuthGrant',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            name: { type: 'string', required: true },
            description: { type: 'string', required: false },
            challenge: { type: 'string', required: true, uniqueItems: true },
            status: { type: 'string', required: true },
            scope: { type: 'string', required: true },
            createdAt: { type: 'string', required: true },
            expiresAt: { type: 'string', required: true },
            delegateDid: { type: 'string', required: true },
            ownerProfileId: { type: 'string', required: true },
            effectiveProfileId: { type: 'string', required: true },
            audience: { type: 'string', required: true },
            createdBy: { type: 'string', required: true },
        },
        relationships: {
            authorizesDelegateGrant: {
                model: Profile,
                direction: 'in',
                name: 'AUTHORIZES_DELEGATE_GRANT',
            },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default DelegateAuthGrant;
