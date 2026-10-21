import { readUserData } from './read-user-data.mjs';

// This example's only cache. Never serve it without a fresh access check.
export const consentCache = new Map();

export const refreshAccess = async (learnCard, userDid, contractUri) => {
    const key = JSON.stringify([contractUri, userDid]);
    consentCache.delete(key);
    const records = await readUserData(learnCard, userDid, contractUri);
    if (records.length === 0) return false;
    consentCache.set(key, records);
    return true;
};
