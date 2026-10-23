import {
    parseInAppMessagesFlagWithErrors,
    type InAppMessagePredicate,
    type ParsedInAppMessagesFlag,
} from '@learncard/types';

export const IN_APP_MESSAGES_FLAG_KEY = 'inAppMessagesV2';
export const LEGACY_IN_APP_MESSAGES_FLAG_KEY = 'inAppMessages';

const usesCredentialTargeting = (predicate: InAppMessagePredicate): boolean => {
    if ('credential' in predicate) return true;
    if ('all' in predicate) return predicate.all.some(usesCredentialTargeting);
    if ('any' in predicate) return predicate.any.some(usesCredentialTargeting);
    if ('not' in predicate) return usesCredentialTargeting(predicate.not);
    return false;
};

/** Keep the legacy feed compatible with clients released before targeting and triggers. */
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
        message =>
            message.trigger || (message.targeting && usesCredentialTargeting(message.targeting))
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
                error: `Credential targeting and triggered campaigns must be delivered through ${IN_APP_MESSAGES_FLAG_KEY}, not ${LEGACY_IN_APP_MESSAGES_FLAG_KEY}`,
            })),
        ],
    };
};
