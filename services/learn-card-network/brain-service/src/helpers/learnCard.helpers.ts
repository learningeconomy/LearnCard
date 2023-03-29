import { initLearnCard, EmptyLearnCard, LearnCardFromSeed } from '@learncard/core';
import { initDidWebLearnCard, DidWebLearnCard } from '@learncard/did-web-plugin';

import didkit from '../didkit_wasm_bg.wasm';

let emptyLearnCard: EmptyLearnCard['returnValue'];
let learnCard: LearnCardFromSeed['returnValue'];
let didWebLearnCard: DidWebLearnCard;

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

export const getDidWebLearnCard = async (): Promise<DidWebLearnCard> => {
    const seed = process.env.SEED;

    // TODO: is this best as an env variable, or can we grab implicitly, like in dids.ts?
    const domainName = process.env.DOMAIN_NAME;
    const domain =
        !domainName || process.env.IS_OFFLINE
            ? `localhost%3A${process.env.PORT || 3000}`
            : domainName;
    const didWeb = `did:web:${domain}`;

    if (!seed) throw new Error('No seed set!');

    if (!didWebLearnCard) didWebLearnCard = await initDidWebLearnCard({ didkit, seed, didWeb });

    return didWebLearnCard;
};