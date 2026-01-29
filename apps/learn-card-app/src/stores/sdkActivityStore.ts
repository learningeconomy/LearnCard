import { createStore } from '@udecode/zustood';

/**
 * Store for tracking SDK/partner-connect activity.
 * Used to show a subtle loading indicator when SDK operations are in progress.
 */
export const sdkActivityStore = createStore('sdkActivityStore')<{
    activeRequests: number;
}>({ activeRequests: 0 })
    .extendSelectors((_set, get) => ({
        isActive: () => get.activeRequests() > 0,
    }))
    .extendActions((set, get) => ({
        startActivity: () => {
            set.activeRequests(get.activeRequests() + 1);
        },
        endActivity: () => {
            set.activeRequests(Math.max(0, get.activeRequests() - 1));
        },
    }));

export default sdkActivityStore;
