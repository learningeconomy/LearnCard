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
     * Legacy gemini-embedding-001 (768-d) vector. Still written on skill changes and read by
     * semantic search until SKILL_EMBEDDING_BEDROCK_READ_ENABLED is on (LC-2206); dropped by the
     * post-rollback-window cleanup. Nova 2 vectors live in generation-specific properties
     * (see config/skillEmbedding.ts).
     */
    embedding?: number[];
};
