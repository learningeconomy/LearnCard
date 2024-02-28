import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';
import { Profile, ProfileInstance } from './Profile';
import { neogma } from '@instance';

import { ConsentFlowType } from 'types/consentflowcontract';

export type ConsentFlowRelationships = {
    createdBy: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
    consentsTo: ModelRelatedNodesI<
        typeof Profile,
        ProfileInstance,
        { createdAt: string; updatedAt: string; terms: string },
        { createdAt: string; updatedAt: string; terms: string }
    >;
};

export type ConsentFlowInstance = NeogmaInstance<ConsentFlowType, ConsentFlowRelationships>;

export const ConsentFlowContract = ModelFactory<ConsentFlowType, ConsentFlowRelationships>(
    {
        label: 'ConsentFlowContract',
        schema: {
            id: { type: 'string', required: true },
            contract: { type: 'string', required: true },
            createdAt: { type: 'string', required: true },
            updatedAt: { type: 'string', required: true },
        },
        relationships: {
            createdBy: { model: Profile, direction: 'out', name: 'CREATED_BY' },
            consentsTo: {
                model: Profile,
                direction: 'in',
                name: 'CONSENTS_TO',
                properties: {
                    terms: { property: 'terms', schema: { type: 'string' } },
                    createdAt: { property: 'createdAt', schema: { type: 'string' } },
                    updatedAt: { property: 'updatedAt', schema: { type: 'string' } },
                },
            },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default ConsentFlowContract;
