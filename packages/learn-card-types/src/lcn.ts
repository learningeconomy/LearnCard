import { z } from 'zod';

export const LCNProfileValidator = z.object({
    handle: z.string(),
    did: z.string(),
    email: z.string().optional(),
    image: z.string().optional(),
});
export type LCNProfile = z.infer<typeof LCNProfileValidator>;
