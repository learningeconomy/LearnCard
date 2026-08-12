import { z } from 'zod';
import { LCNProfileManagerValidator } from '@learncard/types';

export const ProfileManagerValidator = LCNProfileManagerValidator.extend({
    managerType: z.string().optional(),
});
export type ProfileManagerType = z.infer<typeof ProfileManagerValidator>;
