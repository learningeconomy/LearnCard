import { ModelFactory, type ModelRelatedNodesI, type NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { Profile, type ProfileInstance } from './Profile';
import type { FlatAuthGrantType } from '@learncard/types';

export type AuthGrantRelationships = {
    authorizesAuthGrant: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
};

export type AuthGrantInstance = NeogmaInstance<FlatAuthGrantType, AuthGrantRelationships>;

export const AuthGrant = ModelFactory<FlatAuthGrantType, AuthGrantRelationships>(
    {
        label: 'AuthGrant',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            name: { type: 'string', required: true },
            description: { type: 'string', required: false },
            challenge: { type: 'string', required: true, uniqueItems: true },
            status: { type: 'string', required: true },
            scope: { type: 'string', required: true },
            createdAt: { type: 'string', required: true },
            expiresAt: { type: 'string', required: false },
        },
        relationships: {
            authorizesAuthGrant: {
                model: Profile,
                direction: 'in',
                name: 'AUTHORIZES_AUTH_GRANT',
            },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default AuthGrant;
