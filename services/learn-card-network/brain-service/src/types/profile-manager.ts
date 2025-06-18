import type { z } from 'zod';
import { LCNProfileManagerValidator } from '@learncard/types';

export const ProfileManagerValidator = LCNProfileManagerValidator;
export type ProfileManagerType = z.infer<typeof ProfileManagerValidator>;
