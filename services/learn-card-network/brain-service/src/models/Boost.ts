import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { Profile, ProfileInstance } from './Profile';

export type BoostRelationships = {
    createdBy: ModelRelatedNodesI<
        typeof Profile,
        ProfileInstance,
        { date: string },
        { date: string }
    >;
};

export type BoostInstance = NeogmaInstance<{ id: string; boost: string }, BoostRelationships>;

export const Boost = ModelFactory<{ id: string; boost: string }, BoostRelationships>(
    {
        label: 'Boost',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            boost: { type: 'string', required: true },
        },
        primaryKeyField: 'id',
        relationships: {
            createdBy: {
                model: Profile,
                direction: 'out',
                name: 'CREATED_BY',
                properties: {
                    date: { property: 'date', schema: { type: 'string' } },
                },
            },
        },
    },
    neogma
);

export default Boost;
