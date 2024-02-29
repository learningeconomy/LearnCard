import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';
import { Profile, ProfileInstance } from './Profile';
import { neogma } from '@instance';

import { ConsentFlowType, ConsentFlowTermsType } from 'types/consentflowcontract';

export type ConsentFlowRelationships = {
    createdBy: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
    consentsTo: ModelRelatedNodesI<
        typeof Profile,
        ProfileInstance,
        ConsentFlowTermsType,
        ConsentFlowTermsType
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
                    id: { property: 'id', schema: { type: 'string', required: true } },
                    terms: { property: 'terms', schema: { type: 'string', required: true } },
                    createdAt: {
                        property: 'createdAt',
                        schema: { type: 'string', required: true },
                    },
                    updatedAt: {
                        property: 'updatedAt',
                        schema: { type: 'string', required: true },
                    },
                },
            },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default ConsentFlowContract;
