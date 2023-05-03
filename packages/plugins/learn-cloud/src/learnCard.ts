import { initLearnCard, LearnCardFromSeed, AddPlugin } from '@learncard/core';
import { getLearnCloudPlugin } from './plugin';
import { LearnCloudPlugin } from './types';

export type LearnCloudLearnCard = AddPlugin<LearnCardFromSeed['returnValue'], LearnCloudPlugin>;

export const initLearnCloudLearnCard = async (
    _config: LearnCardFromSeed['args'] & { cloud?: string; unencryptedFields?: string[] }
): Promise<LearnCloudLearnCard> => {
    const {
        cloud = 'https://cloud.learncard.com/trpc',
        seed,
        unencryptedFields,
        ...config
    } = _config;

    const baseLearnCard = await initLearnCard({ seed, ...config });

    return baseLearnCard.addPlugin(
        await getLearnCloudPlugin(baseLearnCard, cloud, unencryptedFields)
    );
};
