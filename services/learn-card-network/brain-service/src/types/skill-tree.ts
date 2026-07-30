import { z } from 'zod';

import {
    SkillTreeNode as _SkillTreeNode,
    SkillTreeNodeValidator as _SkillTreeNodeValidator,
    PaginatedSkillTreeValidator as _PaginatedSkillTreeValidator,
    PaginatedSkillTree as _PaginatedSkillTree,
} from '@learncard/types';

export type SkillTreeNode = _SkillTreeNode;
export const SkillTreeNodeValidator: z.ZodType<_SkillTreeNode> = _SkillTreeNodeValidator;

export const PaginatedSkillTreeValidator: z.ZodType<_PaginatedSkillTree> =
    _PaginatedSkillTreeValidator;
export type PaginatedSkillTree = _PaginatedSkillTree;
