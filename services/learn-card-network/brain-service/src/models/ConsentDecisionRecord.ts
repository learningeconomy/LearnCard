import { ModelFactory, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { StoredConsentDecisionRecordType } from 'types/consent-decision-record';

export type ConsentDecisionRecordRelationships = Record<string, never>;

export type ConsentDecisionRecordInstance = NeogmaInstance<
    StoredConsentDecisionRecordType,
    ConsentDecisionRecordRelationships
>;

export const ConsentDecisionRecord = ModelFactory<
    StoredConsentDecisionRecordType,
    ConsentDecisionRecordRelationships
>(
    {
        label: 'ConsentDecisionRecord',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            occurredAt: { type: 'string', required: true },
            ecosystemId: { type: 'string', required: true },
            subjectProfileId: { type: 'string', required: true },
            consentActor: { type: 'string', required: true },
            consentFlowContractId: { type: 'string', required: true },
            consentTermsId: { type: 'string', required: true },
            consentRevision: { type: 'string', required: true },
            consentTiers: { type: 'string', required: true },
            requestedScopes: { type: 'string', required: true },
            approvedScopes: { type: 'string', required: true },
            bindingId: { type: 'string', required: false },
            resourceId: { type: 'string', required: true },
            releaseChannel: { type: 'string', required: true },
            decision: { type: 'string', required: true },
            reasonCodes: { type: 'string', required: true },
            consentActiveAtDecision: { type: 'boolean', required: true },
            policyRevision: { type: 'string', required: true },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default ConsentDecisionRecord;
