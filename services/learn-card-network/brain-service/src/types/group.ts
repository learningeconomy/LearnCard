import { z } from 'zod';
import { GroupValidator } from '@learncard/types';

export const FlatGroupValidator = GroupValidator.omit({
    parentGroupId: true,
    computedCriteria: true,
}).extend({
    parentGroupId: z.string().optional(),
    computedCriteria: z.string().optional(),
});
export type FlatGroupType = z.infer<typeof FlatGroupValidator>;
