import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { Profile, ProfileInstance } from './Profile';
import { Boost, BoostInstance } from './Boost';
import { ConsentFlowTransaction, ConsentFlowTransactionInstance } from './ConsentFlowTransaction';
import { CredentialType } from 'types/credential';

type CredentialReceivedProps = { from: string; date: string } & Record<string, unknown>;

export type CredentialRelationships = {
    credentialReceived: ModelRelatedNodesI<
        { createOne: (typeof Profile)['createOne'] },
        ProfileInstance,
        CredentialReceivedProps,
        CredentialReceivedProps
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
