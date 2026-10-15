import {
    ConsentFlowContractValidator,
    ConsentFlowTermsValidator,
    ConsentFlowTermsStatusValidator,
    ConsentFlowTransactionActionValidator,
    ConsentFlowGuardianApprovalValidator,
    ConsentFlowReferralValidator,
    ConsentFlowContractDetailsValidator,
} from '@learncard/types';
import { z } from 'zod';

type FlatGuardianApproval = {
    [
        Key in keyof z.infer<
            typeof ConsentFlowGuardianApprovalValidator
        > as `guardianApproval.${Key}`
    ]?: string;
};

type FlatReferral = {
    [Key in keyof z.infer<typeof ConsentFlowReferralValidator> as `referral.${Key}`]?: string;
};

type FlatConsentTerms = Partial<Record<`terms.${string}`, string | boolean | string[]>>;

export const DbContractVersionValidator = z.object({
    id: z.string(),
    version: z.coerce.number().int().positive(),
    contract: ConsentFlowContractValidator,
    name: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    reasonForAccessing: z.string().optional(),
    image: z.string().optional(),
    needsGuardianConsent: z.boolean().optional(),
    redirectUrl: z.string().optional(),
    frontDoorBoostUri: z.string().optional(),
    expiresAt: z.string().optional(),
    autoboosts: z.array(z.unknown()).default([]),
    writers: z.array(z.string()).default([]),
    reason: z.string().optional(),
    createdAt: z.string(),
    kind: z.enum(['relaxed', 'expanded_optional', 'requires_consent']).optional(),
});
export type DbContractVersionType = z.infer<typeof DbContractVersionValidator>;

export const DbContractValidator = z.object({
    id: z.string(),
    name: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    reasonForAccessing: z.string().optional(),
    needsGuardianConsent: z.boolean().optional(),
    redirectUrl: z.string().optional(),
    frontDoorBoostUri: z.string().optional(),
    image: z.string().optional(),
    // An empty request has no flattened contract.* properties in Neo4j.
    contract: ConsentFlowContractValidator.prefault({}),
    createdAt: z.string(),
    updatedAt: z.string(),
    expiresAt: z.string().optional(),
    audienceVersion: z.coerce.number().int().nonnegative().optional(),
    hasConsented: z.boolean().optional(),
    currentVersion: z.coerce.number().int().positive().optional(),
    status: z.enum(['active', 'retired']).optional(),
    version: z.coerce.number().int().positive().optional(),
    latestUpdate: z.preprocess(value => {
        if (typeof value !== 'string') return value;
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }, ConsentFlowContractDetailsValidator.shape.latestUpdate.optional()),
});

export type DbContractType = z.infer<typeof DbContractValidator>;
export type FlatDbContractType = Omit<DbContractType, 'contract' | 'latestUpdate'> &
    Partial<Record<`contract.${string}`, string | boolean>> & {
        latestUpdate?: string;
    };

export const DbTransactionValidator = z.object({
    id: z.string(),
    action: ConsentFlowTransactionActionValidator,
    terms: ConsentFlowTermsValidator,
    guardianApproval: ConsentFlowGuardianApprovalValidator.optional(),
    referral: ConsentFlowReferralValidator.optional(),
    date: z.string(),
    expiresAt: z.string().optional(),
    oneTime: z.boolean().optional(),
});

export type DbTransactionType = z.infer<typeof DbTransactionValidator>;
export type FlatDbTransactionType = Omit<
    DbTransactionType,
    'guardianApproval' | 'terms' | 'referral'
> &
    FlatConsentTerms &
    FlatGuardianApproval &
    FlatReferral;

export const DbTermsValidator = z.object({
    smartResumeFingerprint: z.string().optional(),
    smartResumePublicationStatus: z.enum(['pending', 'sending', 'failed', 'succeeded']).optional(),
    smartResumeLeaseId: z.string().optional(),
    smartResumeLeaseUntil: z.coerce.number().optional(),
    smartResumeMutationVersion: z.coerce.number().optional(),
    smartResumeRedirectUrl: z.string().optional(),
    mutationVersion: z.coerce.number().int().nonnegative().optional(),
    id: z.string(),
    status: ConsentFlowTermsStatusValidator,
    consentedVersion: z.coerce.number().int().positive().optional(),
    reconsentDeadline: z.string().optional(),
    newOptionsUntil: z.string().optional(),
    // Neo4j has no properties to store for entirely empty permission objects.
    terms: ConsentFlowTermsValidator.prefault({}),
    guardianApproval: ConsentFlowGuardianApprovalValidator.optional(),
    referral: ConsentFlowReferralValidator.optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    expiresAt: z.string().optional(),
    oneTime: z.boolean().optional(),
});

export type DbTermsType = z.infer<typeof DbTermsValidator>;
export type FlatDbTermsType = Omit<DbTermsType, 'guardianApproval' | 'terms' | 'referral'> &
    FlatConsentTerms &
    FlatGuardianApproval &
    FlatReferral;
