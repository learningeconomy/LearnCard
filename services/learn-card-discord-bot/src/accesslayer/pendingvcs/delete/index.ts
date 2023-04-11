import { PREFIX } from '../create/index';
import { Context } from 'src/types/index';

export const deletePendingVcs = async (
    context: Context,
    scope?: string
): Promise<number | undefined> => {
    const pendingVcKeys = await context.cache.keys(`${PREFIX}${scope ? scope + ':' : ''}*`);
    if (!pendingVcKeys) return 0;
    return context.cache.delete(pendingVcKeys);
};
