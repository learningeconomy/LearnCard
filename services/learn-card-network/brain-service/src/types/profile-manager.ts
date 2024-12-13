import { z } from 'zod';

export const ProfileManagerValidator = z.object({
    id: z.string(),
    alternateIds: z.string().array().optional(),
});
export type ProfileManager = z.infer<typeof ProfileManagerValidator>;
