import { z } from 'zod';

export const SkillFrameworkStatusEnum = z.enum(['active', 'archived']);
export type SkillFrameworkStatus = z.infer<typeof SkillFrameworkStatusEnum>;

export const SkillFrameworkValidator = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    sourceURI: z.string().url().optional(),
    status: SkillFrameworkStatusEnum.default('active'),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export type SkillFrameworkType = z.infer<typeof SkillFrameworkValidator>;
export const FlatSkillFrameworkValidator = SkillFrameworkValidator;
export type FlatSkillFrameworkType = z.infer<typeof FlatSkillFrameworkValidator>;
