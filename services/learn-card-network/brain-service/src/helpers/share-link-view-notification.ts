import cache from '@cache';
import { environment } from '@environment';

const WINDOW_SECONDS = 10 * 60;

/** One owner alert per share per window, claimed atomically across Brain workers. */
export const claimShareViewNotification = async (
    namespace: string,
    shareId: string
): Promise<boolean> => {
    if (environment.NODE_ENV === 'production' && !cache.redis) return false;
    const count = await cache.incr(
        `share-link-view-notification:${namespace}:${shareId}`,
        WINDOW_SECONDS
    );
    // A cache failure suppresses alerts, never privacy enforcement or view counts.
    return count === 1;
};
