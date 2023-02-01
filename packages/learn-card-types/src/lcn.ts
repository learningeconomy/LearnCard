import { z } from 'zod';

export const LCNProfileValidator = z.object({
    handle: z.string(),
    did: z.string(),
    email: z.string().optional(),
    image: z.string().optional(),
});
export type LCNProfile = z.infer<typeof LCNProfileValidator>;

export const LCNProfileIDValidator = z.union([
    z.object({ handle: z.string() }),
    z.object({ did: z.string() }),
    z.object({ email: z.string() }),
]);
export type LCNProfileID = z.infer<typeof LCNProfileIDValidator>;
