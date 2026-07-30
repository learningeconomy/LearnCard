import { AddPlugin } from '@learncard/core';
import { LCALearnCard } from '@learncard/lca-api-plugin';
import { RenderMethodPlugin } from '@learncard/render-method-plugin';
import { SQLitePlugin } from 'learn-card-base/plugins/sqlite/types';

export type BespokeLearnCard = AddPlugin<
    AddPlugin<LCALearnCard, SQLitePlugin>,
    RenderMethodPlugin
>;
