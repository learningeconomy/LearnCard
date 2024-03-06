import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';
import { Profile, ProfileInstance } from './Profile';
import { neogma } from '@instance';

import { FlatDbContractType } from 'types/consentflowcontract';

export type ConsentFlowRelationships = {
    createdBy: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
    consentsTo: ModelRelatedNodesI<typeof Profile, ProfileInstance, any, any>;
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
            image: { type: 'string', required: false },
            createdAt: { type: 'string', required: true },
            updatedAt: { type: 'string', required: true },
            expiresAt: { type: 'string', required: false },
            "contract.read.anonymize": { type: 'boolean', required: false },
        },
        relationships: {
            createdBy: { model: Profile, direction: 'out', name: 'CREATED_BY' },
            consentsTo: {
                model: Profile,
                direction: 'in',
                name: 'CONSENTS_TO',
                properties: {
                    id: { property: 'id', schema: { type: 'string', required: true } },
                    createdAt: { property: 'createdAt', schema: { type: 'string', required: true } },
                    updatedAt: { property: 'updatedAt', schema: { type: 'string', required: true } },
                    expiresAt: { property: 'expiresAt', schema: { type: 'string', required: false } },
                },
            },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default ConsentFlowContract;
