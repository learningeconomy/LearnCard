import { inAppMessageValidator, type InAppMessage } from '@learncard/types';

import { isInAppMessagesDebug, setInAppMessagesDebug } from './debug';
import {
    getLastInAppMessages,
    getLastInAppMessagesReport,
    type InAppMessagesReport,
} from './useInAppMessages';
import { resetInAppMessageDismissals } from './dismissalStore';
import { setInAppMessageOverride } from './debugOverrideStore';

export interface InAppMessagesDevApi {
    enable: () => string;
    disable: () => string;
    isEnabled: () => boolean;
    report: () => InAppMessagesReport;
    list: () => string[];
    reset: () => string;
    forceShow: (id: string) => string;
    preview: (message: Partial<InAppMessage> & { title: string }) => string;
    clearForce: () => string;
}

declare global {
    interface Window {
        __inAppMessages?: InAppMessagesDevApi;
    }
}

const api: InAppMessagesDevApi = {
    enable: () => {
        setInAppMessagesDebug(true);

        return 'in-app-messages debug ON — reopen/reload to trace evaluation';
    },
    disable: () => {
        setInAppMessagesDebug(false);

        return 'in-app-messages debug OFF';
    },
    isEnabled: () => isInAppMessagesDebug(),
    report: () => getLastInAppMessagesReport(),
    list: () => getLastInAppMessages().map(m => m.id),
    reset: () => {
        resetInAppMessageDismissals();

        return 'in-app-messages dismissals cleared';
    },
    forceShow: (id: string) => {
        const found = getLastInAppMessages().find(m => m.id === id);

        if (!found) return `no message with id "${id}" — try __inAppMessages.list()`;

        setInAppMessageOverride(found);

        return `forcing "${id}" (bypasses gate, targeting, frequency — not marked seen)`;
    },
    preview: message => {
        const result = inAppMessageValidator.safeParse({ id: `preview-${Date.now()}`, ...message });

        if (!result.success) {
            const issue = result.error.issues[0];

            return `invalid preview message — ${issue.path.join('.') || 'message'}: ${
                issue.message
            }`;
        }

        setInAppMessageOverride(result.data);

        return `previewing "${result.data.id}"`;
    },
    clearForce: () => {
        setInAppMessageOverride(null);

        return 'cleared forced/preview message';
    },
};

export const installInAppMessagesDebugGlobals = (): void => {
    if (typeof window === 'undefined') return;

    window.__inAppMessages = api;
};
