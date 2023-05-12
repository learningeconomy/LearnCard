import crypto from 'crypto';
import { initLearnCard, LearnCardFromSeed } from '@learncard/init';

export const getWallet = async (seed: string): Promise<LearnCardFromSeed['returnValue']> => {
    return initLearnCard({ seed });
};

export const generateRandomSeed = () => crypto.randomBytes(32).toString('hex');
