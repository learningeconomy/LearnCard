import { z } from 'zod';

import { BindingValidator } from '@learncard/types';

export const BindingRecordValidator = BindingValidator.extend({
    revision: z.number().int().nonnegative(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type BindingRecordType = z.infer<typeof BindingRecordValidator>;

export const FlatBindingValidator = BindingRecordValidator.omit({
    provider: true,
    consumer: true,
    revisions: true,
}).extend({
    provider: z.string(),
    consumer: z.string(),
    revisions: z.string(),
});
export type FlatBindingType = z.infer<typeof FlatBindingValidator>;
