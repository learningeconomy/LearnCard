import crypto from 'crypto';

export const generateRandomSeed = () => crypto.randomBytes(32).toString('hex');
