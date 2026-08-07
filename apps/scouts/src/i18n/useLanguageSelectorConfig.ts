/**
 * React bindings for the `hideLanguageSelector` LaunchDarkly flag.
 *
 * `useLanguageSelectorConfig` is the single source of truth consumed by both
 * language-selector surfaces (sidebar `LanguagePicker`, login
 * `LanguagePickerCompact`) and the shared selector modal.
 *
 * `useEnforceVisibleLocale` keeps the active locale in sync with the flag:
 * if the language a user is currently viewing gets hidden, it falls them back
 * to a visible language. Mount it once inside the LaunchDarkly provider tree
 * (see `App`).
 *
 * The flag parsing itself lives in the dependency-free `languageSelectorConfig`
 * module so it can be unit-tested without React/LaunchDarkly.
 */
import { useEffect, useMemo } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import {
    resolveLanguageSelectorConfig,
    type LanguageSelectorConfig,
} from './languageSelectorConfig';
import { useLocale, useChangeLocale, SUPPORTED_LANGUAGES } from './index';
import { getEffectiveSupportedLanguages } from './detectLocale';

/** Resolve the current language-selector configuration from LaunchDarkly. */
export const useLanguageSelectorConfig = (): LanguageSelectorConfig => {
    const flags = useFlags();
    const flagValue = flags?.hideLanguageSelector;

    return useMemo(
        () =>
            resolveLanguageSelectorConfig(
                flagValue,
                getEffectiveSupportedLanguages(SUPPORTED_LANGUAGES)
            ),
        [flagValue]
    );
};

/**
 * Side-effect hook: if the active locale is no longer visible (the flag hid it),
 * switch to a visible language — English when still available, otherwise the
 * first remaining language. No-op when there are no visible languages to fall
 * back to (e.g. the "*" kill-switch), leaving the user on their current locale.
 */
export const useEnforceVisibleLocale = (): void => {
    const { visibleLanguages } = useLanguageSelectorConfig();
    const locale = useLocale();
    const changeLocale = useChangeLocale();

    // Stable primitive dep so the effect only fires when the visible set or the
    // active locale actually changes.
    const visibleKey = visibleLanguages.join(',');

    useEffect(() => {
        if (visibleLanguages.length === 0) return;
        if (visibleLanguages.includes(locale)) return;

        const fallback = visibleLanguages.includes('en') ? 'en' : visibleLanguages[0];
        changeLocale(fallback);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visibleKey, locale, changeLocale]);
};
