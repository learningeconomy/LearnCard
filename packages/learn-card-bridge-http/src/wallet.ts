import fs from 'fs/promises';
import { walletFromKey } from '@learncard/core';
import didkit from './didkit_wasm_bg.wasm';

export const getWallet = async () => {
    const seed = process.env.WALLET_SEED;

    if (!seed) {
        throw new Error('No seed set! Please make a .env file and set WALLET_SEED to your seed!');
    }

    return walletFromKey(seed, { didkit });
};
