import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';
import { Profile, ProfileInstance } from './Profile';
import { neogma } from '@instance';

import { ConsentFlowType } from 'types/consentflowcontract';

export type ConsentFlowRelationships = {
    // Define relationships here
    createdBy: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
};

export type ConsentFlowInstance = NeogmaInstance<
    ConsentFlowType,
    ConsentFlowRelationships
>;

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
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default ConsentFlowContract;