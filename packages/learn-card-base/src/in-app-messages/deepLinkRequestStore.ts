import { createStore } from '@udecode/zustood';

export interface InAppMessageRequest {
    messageId: string;
    token: number;
    requestedAt: number;
}

let sequence = 0;
const store = createStore('inAppMessageRequest')<{
    request: InAppMessageRequest | null;
}>({ request: null });

/** Memory-only intent. Tokens prevent an old presentation from clearing a newer request. */
export const requestInAppMessage = (messageId: string): void => {
    if (!messageId.trim()) return;
    store.set.request({ messageId, token: ++sequence, requestedAt: Date.now() });
};

export const useInAppMessageRequest = store.use.request;
export const getInAppMessageRequest = store.get.request;
export const clearInAppMessageRequest = (token?: number): void => {
    if (token === undefined || store.get.request()?.token === token) store.set.request(null);
};
