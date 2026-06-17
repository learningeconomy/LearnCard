/**
 * Resolve the locale to use when sending a localized message (notification,
 * email, etc.) to a recipient profile.
 *
 * Resolution order:
 *   1. `profile.locale` — the user's persisted BCP-47 preference
 *   2. `'en'` — hard server-side fallback (C0 scope)
 *
 * Future enhancement: fall back to the tenant default language
 * (`tenantConfig.i18n.defaultLanguage`) before 'en'. Kept simple for C0 —
 * the goal is just to plumb the persisted `locale` field end-to-end.
 *
 * @param profile The recipient's profile (or a minimal subset carrying `locale`).
 *                `null`/`undefined` → 'en'.
 */
export const resolveRecipientLocale = (profile?: { locale?: string } | null): string =>
    profile?.locale || 'en';
