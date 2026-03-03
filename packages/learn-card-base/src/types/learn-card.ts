import { AddPlugin } from '@learncard/core';
import { LCALearnCard } from '@learncard/lca-api-plugin';
import { SQLitePlugin } from 'learn-card-base/plugins/sqlite/types';

export type BespokeLearnCard = AddPlugin<LCALearnCard, SQLitePlugin>;
