import { initLearnCard, type LearnCardFromSeed } from '@learncard/init';
import didkit from './didkit_wasm_bg.wasm';

export const getLearnCard = async (): Promise<LearnCardFromSeed['returnValue']> => {
    const seed = process.env.WALLET_SEED;

    if (!seed) {
        throw new Error('No seed set! Please make a .env file and set WALLET_SEED to your seed!');
    }

    return initLearnCard({ seed, didkit });
};
