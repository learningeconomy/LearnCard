import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';
import { Profile, ProfileInstance } from './Profile';
import { neogma } from '@instance';

import { FlatDbContractType } from 'types/consentflowcontract';

export type ConsentFlowRelationships = {
    createdBy: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
};

export type ConsentFlowInstance = NeogmaInstance<FlatDbContractType, ConsentFlowRelationships>;

export const ConsentFlowContract = ModelFactory<FlatDbContractType, ConsentFlowRelationships>(
    {
        label: 'ConsentFlowContract',
        schema: {
            id: { type: 'string', required: true },
            name: { type: 'string', required: true },
            subtitle: { type: 'string', required: false },
            description: { type: 'string', required: false },
            reasonForAccessing: { type: 'string', required: false },
            needsGuardianConsent: { type: 'boolean', required: false },
            redirectUrl: { type: 'string', required: false },
            image: { type: 'string', required: false },
            createdAt: { type: 'string', required: true },
            updatedAt: { type: 'string', required: true },
            expiresAt: { type: 'string', required: false },
        } as any,
        relationships: { createdBy: { model: Profile, direction: 'out', name: 'CREATED_BY' } },
        primaryKeyField: 'id',
    },
    neogma
);

export default ConsentFlowContract;
