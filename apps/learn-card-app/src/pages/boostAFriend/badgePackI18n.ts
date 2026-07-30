/**
 * Render-layer i18n helpers for the Boost-a-Friend badge picker.
 *
 * Badge packs (`src/registries/badge-packs/*.json`, loaded via `useBadgePacks`)
 * ship English `label`/`description` data keyed by stable ids and types. This
 * helper translates that data at the render site, keyed by the stable
 * category id / badge type, falling back to the English JSON string.
 *
 * Badge NAMES/titles are canonical credential titles and are intentionally
 * NOT translated here.
 */
import * as m from '../../paraglide/messages.js';

/**
 * Resolve a paraglide message by dynamic key, falling back to the supplied
 * English string when the key has no registered message function.
 */
const resolve = (key: string, fallback: string): string => {
    const fn = (m as Record<string, unknown>)[key];
    return typeof fn === 'function' ? (fn as () => string)() : fallback;
};

/**
 * Derive the paraglide key segment from a badge `type` by dropping everything
 * up to and including the last ':' and stripping non-alphanumerics.
 * e.g. "ext:VibeCurator" → "VibeCurator", "ext:CLRCartographer" → "CLRCartographer".
 */
const sanitizeType = (type: string): string =>
    type
        .split(':')
        .pop()!
        .replace(/[^a-zA-Z0-9]/g, '');

/** Translate a badge category label, keyed by the stable category id. */
export const tBadgeCategoryLabel = (id: string, fallback: string): string =>
    resolve(`badgeSummit.cat.${id}.label`, fallback);

/** Translate a badge category description, keyed by the stable category id. */
export const tBadgeCategoryDesc = (id: string, fallback: string): string =>
    resolve(`badgeSummit.cat.${id}.desc`, fallback);

/** Translate a badge description, keyed by the sanitized badge type. */
export const tBadgeDesc = (type: string, fallback: string): string =>
    resolve(`badgeSummit.badge.${sanitizeType(type)}.desc`, fallback);
