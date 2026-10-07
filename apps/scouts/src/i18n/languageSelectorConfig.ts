/**
 * Pure resolver for the `hideLanguageSelector` LaunchDarkly flag.
 *
 * The flag is a JSON variation whose value is an array of language codes to
 * hide from the language selector UI:
 *
 *   []                    → show everything (default / when LD is unreachable)
 *   ["fr", "ar"]          → hide French & Arabic; selector lists the rest
 *   ["*"]                 → explicit kill-switch; hides the whole selector
 *
 * Natural rule: if filtering leaves ≤ 1 visible language, the selector hides
 * itself too — a one-option picker is pointless.
 *
 * Defensive parsing: invalid/unknown entries are ignored, and a stray boolean
 * is honored (`true` → hide all, `false` → show all) so the UI behaves sanely
 * during the boolean→JSON reconfiguration window in LaunchDarkly.
 *
 * This module is intentionally free of React/LaunchDarkly imports so it can be
 * unit-tested in isolation. The hook wrapper lives in
 * `useLanguageSelectorConfig.ts`.
 */
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from './index';

const WILDCARD = '*';

export type LanguageSelectorConfig = {
    /** True when the entire selector UI should be hidden on every surface. */
    hideSelector: boolean;
    /** Supported languages that remain selectable, in SUPPORTED_LANGUAGES order. */
    visibleLanguages: SupportedLanguage[];
    /** Supported languages explicitly hidden by the flag, in SUPPORTED_LANGUAGES order. */
    hiddenLanguages: SupportedLanguage[];
};

/**
 * Resolve the flag value into a concrete selector configuration.
 *
 * @param flagValue Raw LaunchDarkly flag value (untyped — could be undefined,
 *   an array, a boolean, or malformed).
 * @param supported The set of languages the app supports. Defaults to
 *   SUPPORTED_LANGUAGES; injectable for tests.
 */
export const resolveLanguageSelectorConfig = (
    flagValue: unknown,
    supported: readonly SupportedLanguage[] = SUPPORTED_LANGUAGES
): LanguageSelectorConfig => {
    const showAll: LanguageSelectorConfig = {
        hideSelector: false,
        visibleLanguages: [...supported],
        hiddenLanguages: [],
    };

    // Boolean back-compat (flag may still be boolean mid-reconfiguration).
    if (flagValue === true) return hideEverything(supported);
    if (flagValue === false || flagValue == null) return showAll;

    // Anything that isn't an array is treated as "show all" — predictable and
    // safe against malformed config (objects, bare strings, numbers).
    if (!Array.isArray(flagValue)) return showAll;

    const normalized = flagValue
        .filter((entry): entry is string => typeof entry === 'string')
        .map(entry => entry.trim().toLowerCase());

    if (normalized.includes(WILDCARD)) return hideEverything(supported);

    const hiddenSet = new Set(normalized);
    const hiddenLanguages = supported.filter(lang => hiddenSet.has(lang));
    const visibleLanguages = supported.filter(lang => !hiddenSet.has(lang));

    return {
        hideSelector: visibleLanguages.length <= 1,
        visibleLanguages,
        hiddenLanguages,
    };
};

const hideEverything = (supported: readonly SupportedLanguage[]): LanguageSelectorConfig => ({
    hideSelector: true,
    visibleLanguages: [],
    hiddenLanguages: [...supported],
});
