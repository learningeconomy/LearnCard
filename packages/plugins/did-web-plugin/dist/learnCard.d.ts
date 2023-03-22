import { LearnCardFromSeed, AddPlugin } from '@learncard/core';
import { DidWebPlugin } from './types';
export type DidWebLearnCard = AddPlugin<LearnCardFromSeed['returnValue'], DidWebPlugin>;
export declare const initDidWebLearnCard: (_config: LearnCardFromSeed['args'] & {
    didWeb: string;
}) => Promise<DidWebLearnCard>;
