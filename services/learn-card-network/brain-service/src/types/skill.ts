import { z } from 'zod';

export const SkillStatusEnum = z.enum(['active', 'archived']);
export type SkillStatus = z.infer<typeof SkillStatusEnum>;

export const SkillValidator = z.object({
    id: z.string(),
    statement: z.string(),
    description: z.string().optional(),
    code: z.string().optional(),
    type: z.string().default('skill'),
    status: SkillStatusEnum.default('active'),
    parentId: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export type SkillType = z.infer<typeof SkillValidator>;
export const FlatSkillValidator = SkillValidator;
export type FlatSkillType = z.infer<typeof FlatSkillValidator>;
