import { initLearnCard, EmptyLearnCard, LearnCardFromSeed } from '@learncard/core';
import didkit from '../didkit_wasm_bg.wasm';

let emptyLearnCard: EmptyLearnCard['returnValue'];
let learnCard: LearnCardFromSeed['returnValue'];

export const getEmptyLearnCard = async (): Promise<EmptyLearnCard['returnValue']> => {
    if (!emptyLearnCard) emptyLearnCard = await initLearnCard({ didkit });

    return emptyLearnCard;
};

export const getLearnCard = async (): Promise<LearnCardFromSeed['returnValue']> => {
    const seed = process.env.SEED;

    if (!seed) throw new Error('No seed set!');

    if (!learnCard) learnCard = await initLearnCard({ didkit, seed });

    return learnCard;
};
