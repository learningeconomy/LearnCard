import { ModelFactory, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { FlatTagType } from 'types/tag';

export type TagRelationships = Record<string, never>;

export type TagInstance = NeogmaInstance<FlatTagType, TagRelationships>;

export const Tag = ModelFactory<FlatTagType, TagRelationships>(
    {
        label: 'Tag',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            name: { type: 'string', required: true },
            slug: { type: 'string', required: true },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default Tag;
