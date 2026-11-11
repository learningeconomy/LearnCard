import {
    KNOWN_ACHIEVEMENT_TYPES,
    PERSONAL_FIELDS,
    RESERVED_TEMPLATE_VARIABLES,
    TEMPLATE_VARIABLE_REGEX,
    WALLET_CATEGORIES,
} from './constants';
import type { InlineTemplateValidationError, PersonalField, WalletCategory } from './types';

const VARIABLE_BRACES_REGEX = /\{\{([^{}]+)\}\}/g;
const BARE_VARIABLE_REGEX = /^\{\{(\w+)\}\}$/;
const CUSTOM_ACHIEVEMENT_TYPE_REGEX = /^ext:[A-Za-z0-9]+$/;

export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    return Object.prototype.toString.call(value) === '[object Object]';
};

export const isReservedTemplateVariable = (name: string): boolean => {
    return (RESERVED_TEMPLATE_VARIABLES as readonly string[]).includes(name);
};

export const getBareVariableName = (value: unknown): string | undefined => {
    if (typeof value !== 'string') {
        return undefined;
    }

    const match = value.match(BARE_VARIABLE_REGEX);
    return match?.[1];
};

export const hasValidVariableInterpolation = (value: string): boolean => {
    TEMPLATE_VARIABLE_REGEX.lastIndex = 0;
    return TEMPLATE_VARIABLE_REGEX.test(value);
};

export const isIsoDateString = (value: string): boolean => {
    return !Number.isNaN(Date.parse(value));
};

export const deepClone = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map(item => deepClone(item));
    }

    if (isPlainObject(value)) {
        const clone: Record<string, unknown> = {};

        Object.keys(value).forEach(key => {
            clone[key] = deepClone(value[key]);
        });

        return clone;
    }

    return value;
};

export const normalizeForJson = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map(item => normalizeForJson(item));
    }

    if (isPlainObject(value)) {
        const normalized: Record<string, unknown> = {};

        Object.keys(value)
            .sort((a, b) => a.localeCompare(b))
            .forEach(key => {
                const child = normalizeForJson(value[key]);

                if (child !== undefined) {
                    normalized[key] = child;
                }
            });

        return normalized;
    }

    return value;
};

export const stripEmpty = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        const items = value.map(item => stripEmpty(item)).filter(item => item !== undefined);

        return items.length > 0 ? items : undefined;
    }

    if (isPlainObject(value)) {
        const next: Record<string, unknown> = {};

        Object.keys(value).forEach(key => {
            const child = stripEmpty(value[key]);

            if (child !== undefined) {
                next[key] = child;
            }
        });

        return Object.keys(next).length > 0 ? next : undefined;
    }

    return value === undefined ? undefined : value;
};

export const levenshteinDistance = (a: string, b: string): number => {
    const rows = a.length + 1;
    const cols = b.length + 1;
    const dp: number[][] = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => 0)
    );

    for (let row = 0; row < rows; row += 1) {
        dp[row][0] = row;
    }

    for (let col = 0; col < cols; col += 1) {
        dp[0][col] = col;
    }

    for (let row = 1; row < rows; row += 1) {
        for (let col = 1; col < cols; col += 1) {
            const cost = a[row - 1] === b[col - 1] ? 0 : 1;

            dp[row][col] = Math.min(
                dp[row - 1][col] + 1,
                dp[row][col - 1] + 1,
                dp[row - 1][col - 1] + cost
            );
        }
    }

    return dp[a.length][b.length];
};

export const getDidYouMean = (input: string, options: readonly string[]): string | undefined => {
    if (options.length === 0) {
        return undefined;
    }

    const normalizedInput = input.toLowerCase();
    let bestOption: string | undefined;
    let bestScore = Number.POSITIVE_INFINITY;

    options.forEach(option => {
        const normalizedOption = option.toLowerCase();

        if (
            normalizedOption.startsWith(normalizedInput) ||
            normalizedInput.startsWith(normalizedOption) ||
            normalizedOption.includes(normalizedInput)
        ) {
            const prefixScore = 0;

            if (prefixScore < bestScore) {
                bestScore = prefixScore;
                bestOption = option;
            }

            return;
        }

        const score = levenshteinDistance(normalizedInput, normalizedOption);

        if (score < bestScore) {
            bestScore = score;
            bestOption = option;
        }
    });

    if (bestOption === undefined) {
        return undefined;
    }

    const threshold = Math.max(3, Math.floor(input.length / 2));
    return bestScore <= threshold ? bestOption : undefined;
};

export const validateAchievementType = (value: string): string | undefined => {
    if (KNOWN_ACHIEVEMENT_TYPES.includes(value) || CUSTOM_ACHIEVEMENT_TYPE_REGEX.test(value)) {
        return undefined;
    }

    const suggestion = getDidYouMean(value, KNOWN_ACHIEVEMENT_TYPES);
    const suggestionText = suggestion ? `; did you mean "${suggestion}"?` : '';

    return `template.achievementType "${value}" is not a known OBv3 achievementType${suggestionText} Custom types must use the "ext:" prefix`;
};

export const validateInterpolatedString = (
    value: string,
    path: string,
    errors: InlineTemplateValidationError[]
): void => {
    VARIABLE_BRACES_REGEX.lastIndex = 0;
    let match = VARIABLE_BRACES_REGEX.exec(value);

    while (match) {
        const variableName = match[1];

        if (!/^\w+$/.test(variableName)) {
            errors.push({
                path,
                message: `${path} uses invalid variable {{${variableName}}}; variable names must match /^\\w+$/`,
            });
        } else if (isReservedTemplateVariable(variableName)) {
            errors.push({
                path,
                message: `${path} uses reserved variable {{${variableName}}}; it is injected automatically by LearnCard`,
            });
        }

        match = VARIABLE_BRACES_REGEX.exec(value);
    }
};

export const validateWalletCategory = (value: unknown): value is WalletCategory => {
    return typeof value === 'string' && (WALLET_CATEGORIES as readonly string[]).includes(value);
};

export const validatePersonalField = (value: unknown): value is PersonalField => {
    return typeof value === 'string' && (PERSONAL_FIELDS as readonly string[]).includes(value);
};

export const sortUnique = <T extends string>(values: readonly T[]): T[] => {
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
};
