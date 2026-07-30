import { z } from 'zod';
import { SkillStatusEnum, SkillValidator } from '@learncard/types';
import type { SkillType } from '@learncard/types';

export { SkillStatusEnum, SkillValidator };
export type { SkillType };

export const FlatSkillValidator = SkillValidator.extend({
    parentId: z.string().optional(),
});

export type FlatSkillType = z.infer<typeof FlatSkillValidator>;

export type SkillDbType = FlatSkillType & {
    embedding?: number[];
};
