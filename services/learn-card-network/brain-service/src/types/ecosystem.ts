import { z } from 'zod';
import { EcosystemValidator } from '@learncard/types';

export const FlatEcosystemValidator = EcosystemValidator.omit({
    parentEcosystemId: true,
    settings: true,
}).extend({
    parentEcosystemId: z.string().optional(),
    settings: z.string(),
});
export type FlatEcosystemType = z.infer<typeof FlatEcosystemValidator>;
