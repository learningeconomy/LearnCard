import {
    initLearnCard,
    LearnCardFromSeed,
    AddPlugin,
    LearnCardPlugin,
    getLearnCardPlugin,
} from '@learncard/core';
import { getDidWebPlugin } from './plugin';
import { DidWebPlugin } from './types';

export type DidWebLearnCard = AddPlugin<LearnCardFromSeed['returnValue'], DidWebPlugin>;

export const initDidWebLearnCard = async (
    _config: LearnCardFromSeed['args'] & { didWeb: string }
): Promise<DidWebLearnCard> => {
    const { didWeb, seed, ...config } = _config;

    const baseLearnCard = await initLearnCard({ seed, ...config });

    return baseLearnCard.addPlugin(await getDidWebPlugin(baseLearnCard, didWeb));
};
