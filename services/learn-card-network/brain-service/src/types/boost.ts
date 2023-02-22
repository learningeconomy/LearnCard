import { z } from 'zod';

export const BoostValidator = z.object({
    id: z.string(),
    name: z.string().optional(),
    boost: z.string(),
});
export type BoostType = z.infer<typeof BoostValidator>;
