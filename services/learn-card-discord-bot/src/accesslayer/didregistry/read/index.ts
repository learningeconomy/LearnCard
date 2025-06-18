import { PREFIX, CHALLENGE_PREFIX } from '../create/index';
import type { Context } from 'src/types/index';

export const getDIDForSource = async (source: string, context: Context): Promise<string> => {
    const sourceJSON = await context.cache.get(`${PREFIX}${source}`);
    return sourceJSON && JSON.parse(sourceJSON).did;
};

export const getDIDChallengeForSource = async (
    source: string,
    context: Context
): Promise<string> => {
    const sourceJSON = await context.cache.get(`${CHALLENGE_PREFIX}${source}`);
    return sourceJSON && JSON.parse(sourceJSON)?.challenge;
};
