import { initLearnCard, LearnCardFromSeed, AddPlugin } from '@learncard/core';
import { getLearnCardNetworkPlugin } from './plugin';
import { LearnCardNetworkPlugin } from './types';

export const initNetworkLearnCard = async (
    _config: LearnCardFromSeed['args'] & { network: string }
): Promise<AddPlugin<LearnCardFromSeed['returnValue'], LearnCardNetworkPlugin>> => {
    const { network, seed, ...config } = _config;

    const baseLearnCard = await initLearnCard({ seed, ...config });

    return baseLearnCard.addPlugin(await getLearnCardNetworkPlugin(baseLearnCard, network));
};
