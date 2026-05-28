import { initLearnCard } from '@learncard/init';
import type { InitLearnCard } from '@learncard/init';

import { readLearnCardBundle, readLearnCardBundleData } from './importBundle';
import type { ReadLearnCardBundleOptions, ReadLearnCardBundleResult } from './types';

type SeededInitConfig = Extract<InitLearnCard['args'], { seed: string }>;
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type RestoreLearnCardInit = DistributiveOmit<SeededInitConfig, 'seed'>;

export type RestoreLearnCardFromBundleOptions = ReadLearnCardBundleOptions & {
    init: RestoreLearnCardInit;
};

const getSeedEntry = (bundle: ReadLearnCardBundleResult): string => {
    const seedEntry = bundle.entries.find(entry => entry.type === 'key-private-seed');

    if (!seedEntry) {
        throw new Error('LearnCard bundle does not contain key-private-seed and cannot be restored');
    }

    const seed = seedEntry.content.trim();

    if (!/^[0-9a-f]+$/i.test(seed)) {
        throw new Error('LearnCard bundle key-private-seed is not valid hexadecimal seed material');
    }

    return seed;
};

export const readLearnCardBundleSeedData = async (
    data: Buffer,
    options: ReadLearnCardBundleOptions = {}
): Promise<string> => getSeedEntry(await readLearnCardBundleData(data, options));

export const readLearnCardBundleSeed = async (
    path: string,
    options: ReadLearnCardBundleOptions = {}
): Promise<string> => getSeedEntry(await readLearnCardBundle(path, options));

export const restoreLearnCardFromBundleData = async (
    data: Buffer,
    options: RestoreLearnCardFromBundleOptions
): Promise<InitLearnCard['returnValue']> => {
    const seed = await readLearnCardBundleSeedData(data, options);

    return initLearnCard({ ...options.init, seed } as SeededInitConfig);
};

export const restoreLearnCardFromBundle = async (
    path: string,
    options: RestoreLearnCardFromBundleOptions
): Promise<InitLearnCard['returnValue']> => {
    const seed = await readLearnCardBundleSeed(path, options);

    return initLearnCard({ ...options.init, seed } as SeededInitConfig);
};
