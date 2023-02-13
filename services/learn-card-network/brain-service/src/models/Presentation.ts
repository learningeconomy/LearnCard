import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { Profile, ProfileInstance } from './Profile';

export type PresentationRelationships = {
    presentationReceived: ModelRelatedNodesI<
        { createOne: typeof Profile['createOne'] },
        ProfileInstance,
        { from: string; date: string },
        { from: string; date: string }
    >;
};

export type PresentationInstance = NeogmaInstance<
    { id: string; presentation: string },
    PresentationRelationships
>;

export const Presentation = ModelFactory<
    { id: string; presentation: string },
    PresentationRelationships
>(
    {
        label: 'Presentation',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            presentation: { type: 'string', required: true },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default Presentation;
