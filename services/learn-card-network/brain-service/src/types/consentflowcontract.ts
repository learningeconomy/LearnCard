import { FlattenObject } from '@helpers/objects.helpers';
import { ConsentFlowContractValidator, ConsentFlowTermsValidator } from '@learncard/types';
import { z } from 'zod';

export const DbContractValidator = z.object({
    id: z.string(),
    name: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    contract: ConsentFlowContractValidator,
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type DbContractType = z.infer<typeof DbContractValidator>;
export type FlatDbContractType = FlattenObject<DbContractType>;

export const DbTermsValidator = z.object({
    id: z.string(),
    terms: ConsentFlowTermsValidator,
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type DbTermsType = z.infer<typeof DbTermsValidator>;
export type FlatDbTermsType = FlattenObject<DbTermsType>;
