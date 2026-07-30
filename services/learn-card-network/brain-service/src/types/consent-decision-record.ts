import { z } from 'zod';

import { ConsentDecisionRecordValidator } from '@learncard/types';

export const StoredConsentDecisionRecordValidator = ConsentDecisionRecordValidator.omit({
    consentActor: true,
    consentTiers: true,
    requestedScopes: true,
    approvedScopes: true,
    reasonCodes: true,
}).extend({
    consentActor: z.string(),
    consentTiers: z.string(),
    requestedScopes: z.string(),
    approvedScopes: z.string(),
    reasonCodes: z.string(),
});
export type StoredConsentDecisionRecordType = z.infer<typeof StoredConsentDecisionRecordValidator>;
