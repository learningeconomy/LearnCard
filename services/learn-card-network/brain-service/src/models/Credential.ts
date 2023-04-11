import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { Profile, ProfileInstance } from './Profile';
import { Boost, BoostInstance } from './Boost';
import { CredentialType } from 'types/credential';

export type CredentialRelationships = {
    credentialReceived: ModelRelatedNodesI<
        { createOne: (typeof Profile)['createOne'] },
        ProfileInstance,
        { from: string; date: string },
        { from: string; date: string }
    >;
    instanceOf: ModelRelatedNodesI<typeof Boost, BoostInstance>;
};

export type CredentialInstance = NeogmaInstance<CredentialType, CredentialRelationships>;

export const Credential = ModelFactory<CredentialType, CredentialRelationships>(
    {
        label: 'Credential',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            credential: { type: 'string', required: true },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default Credential;
