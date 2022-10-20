import crypto from 'crypto';
import { initLearnCard } from '@learncard/core';

export const getWallet = async (seed: string) => {
    return initLearnCard({ seed });
};

export const generateRandomSeed = () => crypto.randomBytes(32).toString('hex');
