import { parseInAppMessagesFlagWithErrors, type ParsedInAppMessagesFlag } from '@learncard/types';

export const IN_APP_MESSAGES_FLAG_KEY = 'inAppMessagesV2';
export const LEGACY_IN_APP_MESSAGES_FLAG_KEY = 'inAppMessages';

type FlagValueState =
    | 'missing'
    | 'undefined'
    | 'null'
    | 'array'
    | 'object'
    | 'boolean'
    | 'number'
    | 'string'
    | 'function'
    | 'symbol'
    | 'bigint';

export interface InAppMessagesFlagDeliveryDebug {
    requestedKey: string;
    selectedKey: string;
    usedLegacyFallback: boolean;
    requestedValueState: FlagValueState;
    legacyValueState: FlagValueState;
    rawMessageCount: number | null;
    acceptedMessageIds: string[];
    invalidMessages: ParsedInAppMessagesFlag['invalid'];
}

const flagValueState = (flags: Record<string, unknown>, key: string): FlagValueState => {
    if (!Object.prototype.hasOwnProperty.call(flags, key)) return 'missing';

    const value = flags[key];

    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';

    return typeof value;
};

const rawMessageCount = (value: unknown): number | null => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;

    const messages = (value as { messages?: unknown }).messages;

    return Array.isArray(messages) ? messages.length : null;
};

const resolveFlagSource = (
    flags: Record<string, unknown>,
    flagKey: string
): { selectedKey: string; usedLegacyFallback: boolean } => {
    const usedLegacyFallback = flagKey === IN_APP_MESSAGES_FLAG_KEY && flags[flagKey] === undefined;

    return {
        selectedKey: usedLegacyFallback ? LEGACY_IN_APP_MESSAGES_FLAG_KEY : flagKey,
        usedLegacyFallback,
    };
};

/** Rich clients use a separate delivery key; fallback never enables rich legacy entries. */
export const readInAppMessagesFlags = (
    flags: Record<string, unknown>,
    flagKey: string = IN_APP_MESSAGES_FLAG_KEY
): ParsedInAppMessagesFlag => {
    const { selectedKey, usedLegacyFallback } = resolveFlagSource(flags, flagKey);
    const result = parseInAppMessagesFlagWithErrors(flags[selectedKey]);
    if (!usedLegacyFallback && flagKey !== LEGACY_IN_APP_MESSAGES_FLAG_KEY) return result;
    const rejected = result.flag.messages.filter(
        message =>
            message.presentation === 'story' ||
            message.presentation === 'iframe' ||
            message.actions.some(
                ({ action }) => action.type === 'openApp' || action.type === 'openMessage'
            )
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

export const inspectInAppMessagesFlagDelivery = (
    flags: Record<string, unknown>,
    parsed: ParsedInAppMessagesFlag,
    flagKey: string = IN_APP_MESSAGES_FLAG_KEY
): InAppMessagesFlagDeliveryDebug => {
    const { selectedKey, usedLegacyFallback } = resolveFlagSource(flags, flagKey);

    return {
        requestedKey: flagKey,
        selectedKey,
        usedLegacyFallback,
        requestedValueState: flagValueState(flags, flagKey),
        legacyValueState: flagValueState(flags, LEGACY_IN_APP_MESSAGES_FLAG_KEY),
        rawMessageCount: rawMessageCount(flags[selectedKey]),
        acceptedMessageIds: parsed.flag.messages.map(message => message.id),
        invalidMessages: parsed.invalid,
    };
};
