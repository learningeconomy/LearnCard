import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { Profile, ProfileInstance } from './Profile';
import { BoostType, BoostStatus } from 'types/boost';

export type BoostRelationships = {
    createdBy: ModelRelatedNodesI<
        typeof Profile,
        ProfileInstance,
        { date: string },
        { date: string }
    >;
};

export type BoostInstance = NeogmaInstance<BoostType, BoostRelationships>;

export const Boost = ModelFactory<BoostType, BoostRelationships>(
    {
        label: 'Boost',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            name: { type: 'string' },
            type: { type: 'string' },
            category: { type: 'string' },
            boost: { type: 'string', required: true },
            status: { type: 'string', enum: BoostStatus.options }
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
