import {
    ConsentFlowContractValidator,
    ConsentFlowTermsValidator,
    ConsentFlowTermsStatusValidator,
    ConsentFlowTransactionActionValidator,
} from '@learncard/types';
import { z } from 'zod';

export const DbContractValidator = z.object({
    id: z.string(),
    name: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    reasonForAccessing: z.string().optional(),
    needsGuardianConsent: z.boolean().optional(),
    redirectUrl: z.string().optional(),
    frontDoorCredUri: z.string().optional(),
    image: z.string().optional(),
    contract: ConsentFlowContractValidator,
    createdAt: z.string(),
    updatedAt: z.string(),
    expiresAt: z.string().optional(),
});

export type DbContractType = z.infer<typeof DbContractValidator>;
export type FlatDbContractType = DbContractType & { contract: any };

export const DbTransactionValidator = z.object({
    id: z.string(),
    action: ConsentFlowTransactionActionValidator,
    terms: ConsentFlowTermsValidator,
    date: z.string(),
    expiresAt: z.string().optional(),
    oneTime: z.boolean().optional(),
});

export type DbTransactionType = z.infer<typeof DbTransactionValidator>;
export type FlatDbTransactionType = DbTransactionType & { terms: any };

export const DbTermsValidator = z.object({
    id: z.string(),
    status: ConsentFlowTermsStatusValidator,
    terms: ConsentFlowTermsValidator,
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    expiresAt: z.string().optional(),
    oneTime: z.boolean().optional(),
});

export type DbTermsType = z.infer<typeof DbTermsValidator>;
export type FlatDbTermsType = DbTermsType & { terms: any };
