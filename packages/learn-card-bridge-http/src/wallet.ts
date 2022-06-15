import { walletFromKey } from '@learncard/core';

export const getWallet = async () => {
    return walletFromKey('a'.repeat(64));
};
