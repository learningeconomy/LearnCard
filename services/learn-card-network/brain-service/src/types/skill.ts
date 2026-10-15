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
    /**
     * Legacy gemini-embedding-001 (768-d) vector, kept only for the LC-2206 rollback window.
     * Current Nova 2 vectors live in generation-specific properties (see config/skillEmbedding.ts).
     */
    embedding?: number[];
};
