import { ModelFactory, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { FlatSkillFrameworkType } from 'types/skill-framework';

export type SkillFrameworkRelationships = Record<string, never>;

export type SkillFrameworkInstance = NeogmaInstance<
    FlatSkillFrameworkType,
    SkillFrameworkRelationships
>;

export const SkillFramework = ModelFactory<FlatSkillFrameworkType, SkillFrameworkRelationships>(
    {
        label: 'SkillFramework',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            name: { type: 'string', required: true },
            description: { type: 'string', required: false },
            sourceURI: { type: 'string', required: false },
            status: { type: 'string', required: false },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default SkillFramework;
