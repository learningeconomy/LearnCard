import { walletFromKey } from '@learncard/core';

export const getWallet = async (seed: string) => {
    return walletFromKey(seed);
};
