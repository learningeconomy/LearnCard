import { AddPlugin } from '@learncard/core';
import { initLearnCard, LearnCardFromSeed, NetworkLearnCardFromSeed } from '@learncard/init';

import { getLCAPlugin } from './plugin';
import { LCAPlugin } from './types';

export type LCALearnCard = AddPlugin<NetworkLearnCardFromSeed['returnValue'], LCAPlugin>;

export const initLCALearnCard = async (
    _config: LearnCardFromSeed['args'] & {
        lcaAPI?: string;
        seed: string;
        network?: string;
        trustedBoostRegistry?: string;
    }
): Promise<LCALearnCard> => {
    const { lcaAPI = 'https://api.learncard.app/trpc', network = true, ...config } = _config;

    const networkLearnCard = await initLearnCard({ ...config, network });

    // The below any is unnecessary in terms of type safety, but TS likes to throw an error about
    // type instantiation being too deep (or "possibly infinite") if we don't cast to any 🤦
    //
    // See https://github.com/microsoft/TypeScript/issues/34933
    return networkLearnCard.addPlugin(await getLCAPlugin(networkLearnCard, lcaAPI)) as any;
};
