import { ModelFactory } from 'neogma';
import type { NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import type { SkillDbType } from 'types/skill';

export type SkillRelationships = Record<string, never>;

export type SkillInstance = NeogmaInstance<SkillDbType, SkillRelationships>;

export const Skill = ModelFactory<SkillDbType, SkillRelationships>(
    {
        label: 'Skill',
        schema: {
            id: { type: 'string', required: true },
            statement: { type: 'string', required: true },
            description: { type: 'string', required: false },
            code: { type: 'string', required: false },
            icon: { type: 'string', required: false },
            type: { type: 'string', required: false },
            status: { type: 'string', required: false },
            frameworkId: { type: 'string', required: false },
            parentId: { type: 'string', required: false },
            embedding: { type: 'array', items: { type: 'number' }, required: false },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default Skill;
