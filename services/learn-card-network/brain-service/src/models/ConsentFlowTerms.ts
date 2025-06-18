import { ModelFactory, type ModelRelatedNodesI, type NeogmaInstance } from 'neogma';
import { Profile, type ProfileInstance } from './Profile';
import { ConsentFlowContract, type ConsentFlowInstance } from './ConsentFlowContract';
import { neogma } from '@instance';

import type { FlatDbTermsType } from 'types/consentflowcontract';

export type ConsentFlowTermsRelationships = {
    createdBy: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
    consentsTo: ModelRelatedNodesI<typeof ConsentFlowContract, ConsentFlowInstance>;
};

export type ConsentFlowTermsInstance = NeogmaInstance<
    FlatDbTermsType,
    ConsentFlowTermsRelationships
>;

export const ConsentFlowTerms = ModelFactory<FlatDbTermsType, ConsentFlowTermsRelationships>(
    {
        label: 'ConsentFlowTerms',
        schema: {
            id: { type: 'string', required: true },
            status: { type: 'string', required: true },
            createdAt: { type: 'string', required: false },
            updatedAt: { type: 'string', required: false },
            expiresAt: { type: 'string', required: false },
            oneTime: { type: 'boolean', required: false },
            deniedWriters: { type: 'string[]', required: false },
        } as any,
        relationships: {
            createdBy: { model: Profile, direction: 'out', name: 'CREATED_BY' },
            consentsTo: { model: ConsentFlowContract, direction: 'out', name: 'CONSENTS_TO' },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default ConsentFlowTerms;
