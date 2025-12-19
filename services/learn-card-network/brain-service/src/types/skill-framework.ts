import { z } from 'zod';
import {
    SkillFrameworkStatusEnum,
    SkillFrameworkValidator,
    SkillFrameworkType,
} from '@learncard/types';

export { SkillFrameworkStatusEnum, SkillFrameworkValidator, SkillFrameworkType };

// Brain-service specific flat types
export type FlatSkillFrameworkType = z.infer<typeof SkillFrameworkValidator>;
export const FlatSkillFrameworkValidator = SkillFrameworkValidator;
