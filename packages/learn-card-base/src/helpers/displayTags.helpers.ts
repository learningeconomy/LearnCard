import { DisplayTypeEnum } from './display-types';

/**
 * LearnCard display-tag convention (`lc:` namespace)
 * --------------------------------------------------
 * A standards-pure way to carry display *hints* on a credential without any
 * bespoke fields or custom JSON-LD `@context` terms. Hints ride inside the
 * OBv3-native `achievement.tag` array (an optional `string[]` already defined
 * by the Open Badges v3 spec), so they never break interop: wallets that don't
 * understand them simply ignore unknown tags.
 *
 * Format: `lc:<key>:<value>`
 *   - The key is matched case-insensitively.
 *   - Only the first two colons are structural — the value is taken verbatim
 *     after the second colon, so values may themselves contain colons
 *     (e.g. `lc:bgImage:https://example.com/a.png`).
 *
 * Every recognized tag is a HINT, never a requirement:
 *   - Unknown keys are ignored.
 *   - Malformed / invalid values (bad hex, non-enum display type, non-https
 *     url) are ignored rather than throwing.
 *
 * Recognized keys:
 *   - `lc:subtype:<Label>`        Human-facing subtype label, decoupled from the
 *                                 OBv3 `achievementType` (which stays a clean spec
 *                                 value). e.g. `lc:subtype:Trailblazer`.
 *   - `lc:displayType:<enum>`     One of the DisplayTypeEnum values.
 *   - `lc:bgColor:<hex>`          Background color, with or without leading `#`.
 *   - `lc:bgImage:<https url>`    Background image url.
 *   - `lc:accentColor:<hex>`      Accent color, with or without leading `#`.
 */

export const LC_TAG_NAMESPACE = 'lc';

export enum LcTagKey {
    Subtype = 'subtype',
    DisplayType = 'displaytype',
    BgColor = 'bgcolor',
    BgImage = 'bgimage',
    AccentColor = 'accentcolor',
}

const LC_TAG_CANONICAL_KEY: Record<LcTagKey, string> = {
    [LcTagKey.Subtype]: 'subtype',
    [LcTagKey.DisplayType]: 'displayType',
    [LcTagKey.BgColor]: 'bgColor',
    [LcTagKey.BgImage]: 'bgImage',
    [LcTagKey.AccentColor]: 'accentColor',
};

export type LcDisplayHints = {
    subtype?: string;
    displayType?: DisplayTypeEnum;
    backgroundColor?: string;
    backgroundImage?: string;
    accentColor?: string;
};

const HEX_COLOR_REGEX = /^#?(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const isValidDisplayType = (value: string): value is DisplayTypeEnum =>
    (Object.values(DisplayTypeEnum) as string[]).includes(value);

const normalizeHexColor = (value: string): string | undefined => {
    const trimmed = value.trim();
    if (!HEX_COLOR_REGEX.test(trimmed)) return undefined;
    return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
};

const isHttpsUrl = (value: string): boolean => {
    try {
        return new URL(value.trim()).protocol === 'https:';
    } catch {
        return false;
    }
};

/**
 * Parse an OBv3 `achievement.tag` array into structured LearnCard display hints.
 * Non-`lc:` tags and malformed values are silently ignored. Later tags win over
 * earlier ones for the same key.
 */
export const parseLcTags = (tags?: string[]): LcDisplayHints => {
    const hints: LcDisplayHints = {};

    if (!Array.isArray(tags)) return hints;

    for (const tag of tags) {
        if (typeof tag !== 'string') continue;

        const firstColon = tag.indexOf(':');
        if (firstColon === -1) continue;

        const namespace = tag.slice(0, firstColon);
        if (namespace.toLowerCase() !== LC_TAG_NAMESPACE) continue;

        const rest = tag.slice(firstColon + 1);
        const secondColon = rest.indexOf(':');
        if (secondColon === -1) continue;

        const key = rest.slice(0, secondColon).toLowerCase();
        const value = rest.slice(secondColon + 1);
        if (!value) continue;

        switch (key) {
            case LcTagKey.Subtype:
                hints.subtype = value.trim();
                break;
            case LcTagKey.DisplayType: {
                const candidate = value.trim().toLowerCase();
                if (isValidDisplayType(candidate)) hints.displayType = candidate;
                break;
            }
            case LcTagKey.BgColor: {
                const color = normalizeHexColor(value);
                if (color) hints.backgroundColor = color;
                break;
            }
            case LcTagKey.BgImage: {
                if (isHttpsUrl(value)) hints.backgroundImage = value.trim();
                break;
            }
            case LcTagKey.AccentColor: {
                const color = normalizeHexColor(value);
                if (color) hints.accentColor = color;
                break;
            }
            default:
                break;
        }
    }

    return hints;
};

/**
 * Build an OBv3-compliant `achievement.tag` array from LearnCard display hints,
 * for use at issuance time. Only defined, valid hints are emitted. Colors are
 * emitted WITHOUT the leading `#` (the parser accepts both, and bare hex reads
 * cleaner in a tag list).
 */
export const buildLcTags = (hints: LcDisplayHints): string[] => {
    const tags: string[] = [];

    const push = (key: LcTagKey, value: string) =>
        tags.push(`${LC_TAG_NAMESPACE}:${LC_TAG_CANONICAL_KEY[key]}:${value}`);

    if (hints.subtype?.trim()) push(LcTagKey.Subtype, hints.subtype.trim());

    if (hints.displayType && isValidDisplayType(hints.displayType)) {
        push(LcTagKey.DisplayType, hints.displayType);
    }

    if (hints.backgroundColor) {
        const color = normalizeHexColor(hints.backgroundColor);
        if (color) push(LcTagKey.BgColor, color.replace(/^#/, ''));
    }

    if (hints.backgroundImage && isHttpsUrl(hints.backgroundImage)) {
        push(LcTagKey.BgImage, hints.backgroundImage.trim());
    }

    if (hints.accentColor) {
        const color = normalizeHexColor(hints.accentColor);
        if (color) push(LcTagKey.AccentColor, color.replace(/^#/, ''));
    }

    return tags;
};
