import { z } from 'zod';
import { ClaimHookTypeValidator } from '@learncard/types';

export const ClaimHookValidator = z.object({
    id: z.string(),
    type: ClaimHookTypeValidator,
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type ClaimHook = z.infer<typeof ClaimHookValidator>;
