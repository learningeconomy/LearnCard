import { PREFIX } from '../create/index';
import { Context } from 'src/types/index';

export const getDIDForSource = async (source: string, context: Context): string => {
    const sourceJSON = await context.cache.get(`${PREFIX}${source}`);
    return sourceJSON ? JSON.parse(sourceJSON).did : null;
};
