import fs from 'fs/promises';
import { walletFromKey } from '@learncard/core';
import didkit from './didkit_wasm_bg.wasm';

export const getWallet = async () => {
    return walletFromKey('a'.repeat(64), { didkit });
};
