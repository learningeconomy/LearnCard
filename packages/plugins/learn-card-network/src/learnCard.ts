import { initLearnCard, LearnCardFromSeed, AddPlugin } from '@learncard/core';
import { getLearnCardNetworkPlugin } from './plugin';
import { LearnCardNetworkPlugin } from './types';

export type NetworkLearnCard = AddPlugin<LearnCardFromSeed['returnValue'], LearnCardNetworkPlugin>;

export const initNetworkLearnCard = async (
    _config: LearnCardFromSeed['args'] & { network?: string }
): Promise<NetworkLearnCard> => {
    const { network = 'https://network.learncard.com/trpc', seed, ...config } = _config;

    const baseLearnCard = await initLearnCard({ seed, ...config });

    return baseLearnCard.addPlugin(await getLearnCardNetworkPlugin(baseLearnCard, network));
};
