import type { InAppMessage } from '@learncard/types';

/** Field-by-field fallback; indexes refer to the original actions and story screens. */
export const localizeMessage = (message: InAppMessage, locale: string): InAppMessage => {
    const normalized = locale.replace(/_/g, '-').toLowerCase();
    const entries = Object.entries(message.locales ?? {});
    const find = (key: string) =>
        entries.find(([name]) => name.replace(/_/g, '-').toLowerCase() === key)?.[1];
    const exact = find(normalized);
    const language = find(normalized.split('-')[0]);
    return {
        ...message,
        title: exact?.title ?? language?.title ?? message.title,
        body: exact?.body ?? language?.body ?? message.body,
        actions: message.actions.map((action, index) => ({
            ...action,
            label: exact?.actionLabels?.[index] ?? language?.actionLabels?.[index] ?? action.label,
        })),
        steps: message.steps?.map((step, index) => ({
            ...step,
            title: exact?.steps?.[index]?.title ?? language?.steps?.[index]?.title ?? step.title,
            body: exact?.steps?.[index]?.body ?? language?.steps?.[index]?.body ?? step.body,
            actions: step.actions?.map((action, actionIndex) => ({
                ...action,
                label:
                    exact?.steps?.[index]?.actionLabels?.[actionIndex] ??
                    language?.steps?.[index]?.actionLabels?.[actionIndex] ??
                    action.label,
            })),
        })),
        iframe: message.iframe
            ? {
                  ...message.iframe,
                  url: exact?.iframeUrl ?? language?.iframeUrl ?? message.iframe.url,
              }
            : undefined,
    };
};
