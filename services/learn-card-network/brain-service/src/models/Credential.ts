import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { Profile, ProfileInstance } from './Profile';

export type CredentialRelationships = {
    connectionRequested: ModelRelatedNodesI<typeof Credential, CredentialInstance>;
    connectedWith: ModelRelatedNodesI<typeof Credential, CredentialInstance>;
    credentialReceived: ModelRelatedNodesI<
        { createOne: (typeof Profile)['createOne'] },
        ProfileInstance,
        { from: string; date: string },
        { from: string; date: string }
    >;
};

export type CredentialInstance = NeogmaInstance<
    { id: string; credential: string },
    CredentialRelationships
>;

export const Credential = ModelFactory<{ id: string; credential: string }, CredentialRelationships>(
    {
        label: 'Credential',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            credential: { type: 'string', required: true },
        },
        relationships: {
            connectionRequested: { model: 'self', direction: 'out', name: 'CONNECTION_REQUESTED' },
            connectedWith: { model: 'self', direction: 'out', name: 'CONNECTED_WITH' },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default Credential;
