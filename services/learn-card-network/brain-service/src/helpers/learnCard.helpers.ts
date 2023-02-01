import { initLearnCard, EmptyLearnCard } from '@learncard/core';
import didkit from '../didkit_wasm_bg.wasm';

let emptyLearnCard: EmptyLearnCard['returnValue'];

export const getEmptyLearnCard = async (): Promise<EmptyLearnCard['returnValue']> => {
    if (!emptyLearnCard) emptyLearnCard = await initLearnCard({ didkit });

    return emptyLearnCard;
};
