import { createStore } from '@udecode/zustood';

import type { InAppMessage } from '@learncard/types';

export const inAppMessageOverrideStore = createStore('inAppMessageOverride')<{
    overrideMessage: InAppMessage | null;
}>({ overrideMessage: null });

export const useInAppMessageOverride = inAppMessageOverrideStore.use.overrideMessage;

export const setInAppMessageOverride = (message: InAppMessage | null): void => {
    inAppMessageOverrideStore.set.overrideMessage(message);
};
