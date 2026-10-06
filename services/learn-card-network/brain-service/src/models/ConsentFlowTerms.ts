import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';
import { Profile, ProfileInstance } from './Profile';
import { ConsentFlowContract, ConsentFlowInstance } from './ConsentFlowContract';
import { neogma } from '@instance';

import { FlatDbTermsType } from 'types/consentflowcontract';

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
            smartResumeFingerprint: { type: 'string', required: false },
            smartResumePublicationStatus: { type: 'string', required: false },
            smartResumeLeaseId: { type: 'string', required: false },
            smartResumeLeaseUntil: { type: 'number', required: false },
            smartResumeMutationVersion: { type: 'number', required: false },
            smartResumeRedirectUrl: { type: 'string', required: false },
            id: { type: 'string', required: true },
            'referral.requestId': { type: 'string', required: false },
            'referral.requestedBy': { type: 'string', required: false },
            'referral.externalReferenceId': { type: 'string', required: false },
            status: { type: 'string', required: true },
            createdAt: { type: 'string', required: false },
            updatedAt: { type: 'string', required: false },
            mutationVersion: { type: 'number', required: false },
            expiresAt: { type: 'string', required: false },
            oneTime: { type: 'boolean', required: false },
            deniedWriters: { type: 'string[]', required: false },
            'guardianApproval.guardianProfileId': { type: 'string', required: false },
            'guardianApproval.guardianDid': { type: 'string', required: false },
            'guardianApproval.approvedAt': { type: 'string', required: false },
            'guardianApproval.contractUpdatedAt': { type: 'string', required: false },
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
