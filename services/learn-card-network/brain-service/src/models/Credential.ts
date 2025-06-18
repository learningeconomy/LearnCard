import { ModelFactory, type ModelRelatedNodesI, type NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import type { Profile, ProfileInstance } from './Profile';
import type { Boost, BoostInstance } from './Boost';
import type { ConsentFlowTransaction, ConsentFlowTransactionInstance } from './ConsentFlowTransaction';
import type { CredentialType } from 'types/credential';

export type CredentialRelationships = {
    credentialReceived: ModelRelatedNodesI<
        { createOne: (typeof Profile)['createOne'] },
        ProfileInstance,
        { from: string; date: string },
        { from: string; date: string }
    >;
    instanceOf: ModelRelatedNodesI<typeof Boost, BoostInstance>;
    issuedViaTransaction: ModelRelatedNodesI<
        typeof ConsentFlowTransaction,
        ConsentFlowTransactionInstance,
        { date: string },
        { date: string }
    >;
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
