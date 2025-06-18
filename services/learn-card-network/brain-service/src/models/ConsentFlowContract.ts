import { ModelFactory, type ModelRelatedNodesI, type NeogmaInstance } from 'neogma';
import { Profile, type ProfileInstance } from './Profile';
import { neogma } from '@instance';

import type { FlatDbContractType } from 'types/consentflowcontract';
import Boost, { type BoostInstance } from './Boost';

export type ConsentFlowRelationships = {
    createdBy: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
    autoReceive: ModelRelatedNodesI<
        typeof Boost,
        BoostInstance,
        { signingAuthorityEndpoint: string; signingAuthorityName: string; issuer?: string },
        { signingAuthorityEndpoint: string; signingAuthorityName: string; issuer?: string }
    >;
    canWrite: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
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
            frontDoorBoostUri: { type: 'string', required: false },
            image: { type: 'string', required: false },
            createdAt: { type: 'string', required: true },
            updatedAt: { type: 'string', required: true },
            expiresAt: { type: 'string', required: false },
        } as any,
        relationships: {
            createdBy: { model: Profile, direction: 'out', name: 'CREATED_BY' },
            autoReceive: {
                model: Boost,
                direction: 'out',
                name: 'AUTO_RECEIVE',
                properties: {
                    signingAuthorityEndpoint: {
                        property: 'signingAuthorityEndpoint',
                        schema: { type: 'string', required: true },
                    },
                    signingAuthorityName: {
                        property: 'signingAuthorityName',
                        schema: { type: 'string', required: true },
                    },
                    issuer: {
                        property: 'issuer',
                        schema: { type: 'string', required: false },
                    },
                },
            },
            canWrite: { model: Profile, direction: 'out', name: 'CAN_WRITE' },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default ConsentFlowContract;
