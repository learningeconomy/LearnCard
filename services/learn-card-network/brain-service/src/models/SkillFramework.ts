import { ModelFactory } from 'neogma';
import type { NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import type { FlatSkillFrameworkType } from 'types/skill-framework';

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
            image: { type: 'string', required: false },
            sourceURI: { type: 'string', required: false },
            isPublic: { type: 'boolean', required: false },
            status: { type: 'string', required: false },
            createdAt: { type: 'string', required: false },
            updatedAt: { type: 'string', required: false },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default SkillFramework;
