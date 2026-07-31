import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { initLearnCard, LearnCardFromSeed } from '@learncard/init';

const getBundledDidkitPath = (): string => {
    const siblingPath = path.join(__dirname, 'didkit_wasm_bg.wasm');

    if (existsSync(siblingPath)) return siblingPath;

    return path.join(__dirname, 'src', 'didkit_wasm_bg.wasm');
};

let learnCardPromise: Promise<LearnCardFromSeed['returnValue']> | undefined;

export const getLearnCard = async (): Promise<LearnCardFromSeed['returnValue']> => {
    if (learnCardPromise) return learnCardPromise;

    const seed = process.env.WALLET_SEED;

    if (!seed) {
        throw new Error('No seed set! Please make a .env file and set WALLET_SEED to your seed!');
    }

    const didkit = process.env.LOCAL_DIDKIT_PATH
        ? fs.readFile(process.env.LOCAL_DIDKIT_PATH)
        : fs.readFile(getBundledDidkitPath());

    learnCardPromise = initLearnCard({ seed, didkit });

    return learnCardPromise;
};
