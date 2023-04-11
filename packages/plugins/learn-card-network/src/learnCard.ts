import {
    initLearnCard,
    LearnCardFromSeed,
    AddPlugin,
    LearnCardPlugin,
    getLearnCardPlugin,
} from '@learncard/core';
import { getLearnCardNetworkPlugin, getVerifyBoostPlugin } from './plugin';
import { LearnCardNetworkPlugin, VerifyBoostPlugin } from './types';

export type BoostVerificationLearnCard = AddPlugin<
    LearnCardFromSeed['returnValue'],
    VerifyBoostPlugin
>;

export type LCLearnCard = AddPlugin<BoostVerificationLearnCard, LearnCardPlugin>;
export type NetworkLearnCard = AddPlugin<LCLearnCard, LearnCardNetworkPlugin>;

export const initNetworkLearnCard = async (
    _config: LearnCardFromSeed['args'] & { network?: string; trustedBoostRegistry?: string }
): Promise<NetworkLearnCard> => {
    const {
        network = 'https://network.learncard.com/trpc',
        seed,
        trustedBoostRegistry,
        ...config
    } = _config;

    const baseLearnCard = await initLearnCard({ seed, ...config });

    const boostVerificationLearnCard = await baseLearnCard.addPlugin(
        await getVerifyBoostPlugin(baseLearnCard, trustedBoostRegistry)
    );

    // TODO: this is a temporary fix for inheritance logic of verifyCredential plugins and the conflict with the prettify param.
    const learnCardLearnCard = await boostVerificationLearnCard.addPlugin(
        getLearnCardPlugin(boostVerificationLearnCard)
    );

    return learnCardLearnCard.addPlugin(
        await getLearnCardNetworkPlugin(learnCardLearnCard, network)
    );
};
