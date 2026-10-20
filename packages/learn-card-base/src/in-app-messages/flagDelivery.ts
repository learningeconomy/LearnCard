import { parseInAppMessagesFlagWithErrors, type ParsedInAppMessagesFlag } from '@learncard/types';

export const IN_APP_MESSAGES_FLAG_KEY = 'inAppMessagesV2';
export const LEGACY_IN_APP_MESSAGES_FLAG_KEY = 'inAppMessages';

/** Rich clients use a separate delivery key; fallback never enables rich legacy entries. */
export const readInAppMessagesFlags = (
    flags: Record<string, unknown>,
    flagKey: string = IN_APP_MESSAGES_FLAG_KEY
): ParsedInAppMessagesFlag => {
    const legacy = flagKey === IN_APP_MESSAGES_FLAG_KEY && flags[flagKey] === undefined;
    const result = parseInAppMessagesFlagWithErrors(
        flags[legacy ? LEGACY_IN_APP_MESSAGES_FLAG_KEY : flagKey]
    );
    if (!legacy && flagKey !== LEGACY_IN_APP_MESSAGES_FLAG_KEY) return result;
    const rejected = result.flag.messages.filter(
        message => message.presentation === 'story' || message.presentation === 'iframe'
    );
    return {
        flag: {
            ...result.flag,
            messages: result.flag.messages.filter(message => !rejected.includes(message)),
        },
        invalid: [
            ...result.invalid,
            ...rejected.map(message => ({
                id: message.id,
                error: `Rich campaigns must be delivered through ${IN_APP_MESSAGES_FLAG_KEY}, not ${LEGACY_IN_APP_MESSAGES_FLAG_KEY}`,
            })),
        ],
    };
};
