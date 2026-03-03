import { z } from 'zod';
import { SkillStatusEnum, SkillValidator, SkillType } from '@learncard/types';

export { SkillStatusEnum, SkillValidator, SkillType };

export const FlatSkillValidator = SkillValidator.extend({
    parentId: z.string().optional(),
});

export type FlatSkillType = z.infer<typeof FlatSkillValidator>;

export type SkillDbType = FlatSkillType & {
    embedding?: number[];
};
