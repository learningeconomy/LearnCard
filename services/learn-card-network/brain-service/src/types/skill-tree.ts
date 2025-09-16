import { z } from 'zod';
import { SkillValidator, SkillType } from './skill';

export type SkillTreeNode = SkillType & {
    children: SkillTreeNode[];
    hasChildren: boolean;
    childrenCursor?: string | null;
};

export const SkillTreeNodeValidator: z.ZodType<SkillTreeNode> = SkillValidator.extend({
    children: z.array(z.lazy(() => SkillTreeNodeValidator)),
    hasChildren: z.boolean(),
    childrenCursor: z.string().nullable().optional(),
}).openapi({ ref: 'SkillTreeNode' }) as any;

export const PaginatedSkillTreeValidator = z.object({
    hasMore: z.boolean(),
    cursor: z.string().nullable(),
    records: z.array(SkillTreeNodeValidator),
});

export type PaginatedSkillTree = z.infer<typeof PaginatedSkillTreeValidator>;
