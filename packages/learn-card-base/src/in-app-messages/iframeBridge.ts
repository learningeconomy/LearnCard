import { z } from 'zod';
import { inAppMessageActionTargetValidator, inAppMessageHttpsUrlValidator } from '@learncard/types';

const safeTarget = inAppMessageActionTargetValidator.refine(action => {
    if (action.type === 'capgoUpdate') return false;
    if (action.type === 'internalLink') {
        return (
            action.path.startsWith('/') &&
            !action.path.startsWith('//') &&
            [...action.path].every(
                char =>
                    char.charCodeAt(0) > 32 &&
                    char.charCodeAt(0) !== 127 &&
                    char !== '\\' &&
                    !/\s/.test(char)
            )
        );
    }
    if (action.type === 'externalLink')
        return inAppMessageHttpsUrlValidator.safeParse(action.url).success;
    if (action.type === 'appStore')
        return [action.iosUrl, action.androidUrl, action.webUrl].every(
            url => url === undefined || inAppMessageHttpsUrlValidator.safeParse(url).success
        );
    return true;
});

export const iframeMessageValidator = z.discriminatedUnion('event', [
    z.object({ type: z.literal('LC_IN_APP_MESSAGE'), event: z.literal('ready') }).strict(),
    z.object({ type: z.literal('LC_IN_APP_MESSAGE'), event: z.literal('close') }).strict(),
    z
        .object({
            type: z.literal('LC_IN_APP_MESSAGE'),
            event: z.literal('runAction'),
            action: safeTarget,
        })
        .strict(),
]);

/** Never accept messages from another tab, a sibling frame, or a redirected origin. */
export const parseIframeMessage = (
    event: MessageEvent,
    frame: Window | null,
    url: string
): z.infer<typeof iframeMessageValidator> | null => {
    if (!frame || event.source !== frame || event.origin !== new URL(url).origin) return null;
    const result = iframeMessageValidator.safeParse(event.data);
    return result.success ? result.data : null;
};
