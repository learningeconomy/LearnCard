import { initLearnCard, LearnCardFromSeed, AddPlugin } from '@learncard/core';
import { getLearnCardNetworkPlugin, getVerifyBoostPlugin } from './plugin';
import { LearnCardNetworkPlugin, VerifyBoostPlugin } from './types';

export type BoostVerificationLearnCard = AddPlugin<
    LearnCardFromSeed['returnValue'],
    VerifyBoostPlugin
>;
export type NetworkLearnCard = AddPlugin<BoostVerificationLearnCard, LearnCardNetworkPlugin>;

export const initNetworkLearnCard = async (
    _config: LearnCardFromSeed['args'] & { network?: string }
): Promise<NetworkLearnCard> => {
    const { network = 'https://network.learncard.com/trpc', seed, ...config } = _config;

    const baseLearnCard = await initLearnCard({ seed, ...config });

    const boostVerificationLearnCard = await baseLearnCard.addPlugin(
        await getVerifyBoostPlugin(baseLearnCard)
    );

    return boostVerificationLearnCard.addPlugin(
        await getLearnCardNetworkPlugin(boostVerificationLearnCard, network)
    );
};