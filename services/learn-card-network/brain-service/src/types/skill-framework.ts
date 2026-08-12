import type { z } from 'zod';
import { SkillFrameworkStatusEnum, SkillFrameworkValidator } from '@learncard/types';
import type { SkillFrameworkType } from '@learncard/types';

export { SkillFrameworkStatusEnum, SkillFrameworkValidator };
export type { SkillFrameworkType };

// Brain-service specific flat types
export type FlatSkillFrameworkType = z.infer<typeof SkillFrameworkValidator> & {
    isPublic?: boolean;
};
export const FlatSkillFrameworkValidator = SkillFrameworkValidator;
