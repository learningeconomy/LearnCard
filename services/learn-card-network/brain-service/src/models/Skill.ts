import { ModelFactory, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { FlatSkillType } from 'types/skill';

export type SkillRelationships = Record<string, never>;

export type SkillInstance = NeogmaInstance<FlatSkillType, SkillRelationships>;

export const Skill = ModelFactory<FlatSkillType, SkillRelationships>(
    {
        label: 'Skill',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            statement: { type: 'string', required: true },
            description: { type: 'string', required: false },
            code: { type: 'string', required: false },
            type: { type: 'string', required: false },
            status: { type: 'string', required: false },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default Skill;
