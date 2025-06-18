import { randomUUID } from 'crypto';
import type { Context, PendingVc } from 'src/types/index';

export const PREFIX = 'pendingvc:';

export const createPendingVc = async (pendingVc: PendingVc, context: Context, scope?: string) => {
    if (!pendingVc._id) pendingVc._id = randomUUID();
    return context.cache.set(
        `${PREFIX}${scope || 'default'}:${pendingVc._id}`,
        JSON.stringify(pendingVc)
    );
};
