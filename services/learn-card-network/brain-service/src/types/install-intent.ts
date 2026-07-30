import { z } from 'zod';

import { InstallIntentStatusValidator, InstallIntentValidator } from '@learncard/types';

export const InstallIntentStatusRecordValidator = InstallIntentStatusValidator.extend({
    retryCount: z.number().int().nonnegative().default(0),
    nextAttemptAt: z.string().datetime().optional(),
});
export type InstallIntentStatusRecordType = z.infer<typeof InstallIntentStatusRecordValidator>;

export const InstallIntentRecordValidator = InstallIntentValidator.omit({ status: true }).extend({
    status: InstallIntentStatusRecordValidator.optional(),
    specRevision: z.number().int().nonnegative(),
    statusRevision: z.number().int().nonnegative(),
    policyRevision: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type InstallIntentRecordType = z.infer<typeof InstallIntentRecordValidator>;

export const FlatInstallIntentValidator = InstallIntentRecordValidator.omit({
    proposal: true,
    approval: true,
    plan: true,
    spec: true,
    status: true,
}).extend({
    proposal: z.string(),
    approval: z.string(),
    plan: z.string(),
    spec: z.string().optional(),
    status: z.string().optional(),
});
export type FlatInstallIntentType = z.infer<typeof FlatInstallIntentValidator>;
