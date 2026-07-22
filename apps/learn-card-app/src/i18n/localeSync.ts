import type { SupportedLanguage } from './index';

export type LocaleSyncAction =
    | { action: 'none' }
    | { action: 'restore'; locale: SupportedLanguage }
    | { action: 'sync' };

/**
 * Decide how to reconcile the active UI locale with the user's saved profile
 * locale, given whether the user has made an explicit in-session pick
 * (`localStorage['i18n.language']` present).
 *
 * Precedence:
 *   - profile matches UI → nothing to do.
 *   - profile has a saved language the current tenant does NOT offer → nothing
 *     to do. The profile locale is global across tenants, so we must neither
 *     restore a language this tenant hides nor clobber the user's saved choice
 *     just because they happened to open a tenant with a narrower language set.
 *   - profile has a saved language AND no explicit pick → RESTORE it to the UI.
 *     (Never write the default UI locale back — that overwrote saved prefs on
 *     re-login after logout cleared localStorage.)
 *   - explicit in-session pick → SYNC UI → profile (the pick wins).
 *   - no saved language yet → SYNC (safe to capture the current UI locale).
 *
 * `profileLocale` must already be normalized to a supported base tag (or
 * `undefined` when absent/unsupported) by the caller.
 * `tenantSupportsProfileLocale` reports whether that tag survives the tenant's
 * `getEffectiveSupportedLanguages()` filter; it is ignored when there is no
 * saved profile locale.
 */
export const decideLocaleSync = (
    uiLocale: SupportedLanguage,
    profileLocale: SupportedLanguage | undefined,
    hasManualChoice: boolean,
    tenantSupportsProfileLocale = true
): LocaleSyncAction => {
    if (!profileLocale) return { action: 'sync' };
    if (profileLocale === uiLocale) return { action: 'none' };
    if (!tenantSupportsProfileLocale) return { action: 'none' };
    if (!hasManualChoice) return { action: 'restore', locale: profileLocale };
    return { action: 'sync' };
};
