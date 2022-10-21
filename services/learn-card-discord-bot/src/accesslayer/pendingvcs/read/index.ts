import { PREFIX } from '../create/index';
import { Context, PendingVc } from 'src/types/index';

export const getPendingVcs = async (
    context: Context,
    scope?: string
): Promise<PendingVc[]> => {
    const pendingVcKeys = await context.cache.keys(`${PREFIX}${scope ? scope + ':' : ''}*`);
    if (!pendingVcKeys) return [];
    const issuers = await Promise.all(
        pendingVcKeys.map(async key => {
            const value = await context.cache.get(key);
            return JSON.parse(value);
        })
    );
    return issuers;
};

export const getPendingVcById = async (
    id: string,
    context: Context,
    scope?: string
): Promise<PendingVc> => {
    const pendingVcJSON = await context.cache.get(`${PREFIX}${scope || 'default'}:${id}`);
    return pendingVcJSON ? JSON.parse(pendingVcJSON) : null;
};
