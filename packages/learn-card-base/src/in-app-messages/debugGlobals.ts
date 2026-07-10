import { isInAppMessagesDebug, setInAppMessagesDebug } from './debug';
import { getLastInAppMessagesReport, type InAppMessagesReport } from './useInAppMessages';
import { resetInAppMessageDismissals } from './dismissalStore';

export interface InAppMessagesDevApi {
    enable: () => string;
    disable: () => string;
    isEnabled: () => boolean;
    report: () => InAppMessagesReport;
    reset: () => string;
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
    reset: () => {
        resetInAppMessageDismissals();

        return 'in-app-messages dismissals cleared';
    },
};

export const installInAppMessagesDebugGlobals = (): void => {
    if (typeof window === 'undefined') return;

    window.__inAppMessages = api;
};
