import { z } from 'zod';
import { BoostPermissionsValidator } from '@learncard/types';

export const RoleValidator = BoostPermissionsValidator.extend({ id: z.string() });
export type Role = z.infer<typeof RoleValidator>;
