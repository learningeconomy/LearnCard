/**
 * Locale auto-detection
 * ─────────────────────
 * Resolves the user's preferred locale on first launch.
 *
 * Priority order (highest first):
 *   1. Persisted choice — localStorage `i18n.language` (user manually picked a locale; never override this)
 *   2. Native device locale — Capacitor `Device.getLanguageCode()` on iOS/Android
 *   3. Browser locale — `navigator.language` / `navigator.languages[0]` on web
 *   4. Tenant default — `tenant.i18n.defaultLanguage`
 *   5. Hard fallback — `'en'`
 *
 * Regional locales are normalized to their language portion: `'ko-KR'` → `'ko'`,
 * `'pt-BR'` → `'pt'`. The detected code is then validated against the branch's
 * SUPPORTED_LANGUAGES set; if no supported locale matches, falls through to the
 * tenant default.
 *
 * Capacitor `Device` is async, so this module exports two functions:
 *   - `detectInitialLocaleSync()`  — synchronous, skips Capacitor Device. Use in
 *     React `useState` initializers / i18next init where blocking on async isn't
 *     practical. On web this is the full chain. On native it skips step 2 and
 *     falls through to navigator/tenant.
 *   - `detectInitialLocale(supported)` — async, includes Capacitor Device. Run
 *     in a one-shot effect after first render; if it returns a different locale
 *     than the sync result, change the active locale.
 *
 * Both functions take the branch's supported-languages list as their first arg
 * so a single helper can serve both i18next and Paraglide branches. Pass it the
 * branch-local `SUPPORTED_LANGUAGES as readonly string[]`.
 */

import { Capacitor } from '@capacitor/core';

/**
 * Reads `navigator.language` / `navigator.languages[0]` if running in a
 * browser-like environment. Returns the raw locale string (possibly regional,
 * e.g. `'ko-KR'`) or undefined if `navigator` is unavailable.
 */
function readBrowserLocale(): string | undefined {
    if (typeof navigator === 'undefined') return undefined;
    if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
        return navigator.languages[0];
    }
    return navigator.language || undefined;
}

/**
 * Reads the previously-persisted user choice from localStorage. Returns
 * undefined if there's no entry or the storage layer is unavailable
 * (e.g. SSR).
 */
function readPersistedLocale(): string | undefined {
    if (typeof localStorage === 'undefined') return undefined;
    try {
        return localStorage.getItem('i18n.language') ?? undefined;
    } catch {
        // localStorage can throw in private mode / some Capacitor contexts
        return undefined;
    }
}

/**
 * Loads the tenant config's `i18n.defaultLanguage` from the public
 * tenant-config.json. We fetch synchronously is impossible, so this reads from
 * an in-memory cache that the bootstrap layer populates before React mounts.
 *
 * Falls back to undefined if the tenant config hasn't been loaded yet.
 */
let cachedTenantDefault: string | undefined;
export function setTenantDefaultLocaleCache(locale: string | undefined): void {
    cachedTenantDefault = locale;
}
function readTenantDefaultLocale(): string | undefined {
    return cachedTenantDefault;
}

/**
 * Strips the regional suffix from a BCP-47 locale tag. `'ko-KR'` → `'ko'`,
 * `'pt-BR'` → `'pt'`, `'zh-Hans-CN'` → `'zh'`. Empty/undefined returns the
 * input unchanged so callers can chain `?? next`.
 */
function normalizeLocale(raw: string | undefined): string | undefined {
    if (!raw) return raw;
    const lower = raw.toLowerCase();
    const dash = lower.indexOf('-');
    return dash > 0 ? lower.slice(0, dash) : lower;
}

/**
 * Picks the first candidate that matches the branch's supported set. If none
 * match, returns undefined so the caller can continue down the priority list.
 */
function pickSupported(
    candidates: Array<string | undefined>,
    supported: readonly string[]
): string | undefined {
    const supportedSet = new Set(supported);
    for (const c of candidates) {
        const n = normalizeLocale(c);
        if (n && supportedSet.has(n)) return n;
    }
    return undefined;
}

/**
 * Synchronous detection. Use this in `useState` initializers or anywhere the
 * caller can't await. On native this skips the Capacitor Device step — wire
 * `detectInitialLocale()` (async) in a follow-up effect to upgrade the choice.
 *
 * @param supported Branch's SUPPORTED_LANGUAGES list (e.g. `['en','es','fr','ar']`)
 * @param fallback Last-resort fallback (typically `'en'`)
 */
export function detectInitialLocaleSync(supported: readonly string[], fallback = 'en'): string {
    return (
        pickSupported([readPersistedLocale()], supported) ??
        pickSupported([readBrowserLocale()], supported) ??
        pickSupported([readTenantDefaultLocale()], supported) ??
        fallback
    );
}

/**
 * Async detection. Adds Capacitor `Device.getLanguageCode()` as the highest-
 * priority *non-persisted* source — i.e. it sits below the user's manually-
 * persisted choice (localStorage) but above all other autodetect sources.
 *
 * Returns the locale string. If detection fails for any reason, falls back to
 * the synchronous chain.
 *
 * Typical use:
 * ```tsx
 * useEffect(() => {
 *   void detectInitialLocale(SUPPORTED_LANGUAGES).then(loc => {
 *     if (loc !== currentLocale && !localStorage.getItem('i18n.language')) {
 *       changeLocale(loc);
 *     }
 *   });
 * }, []);
 * ```
 * The `!localStorage.getItem('i18n.language')` guard is important — once a user
 * manually picks a language, we never override it with autodetection on later
 * launches.
 */
export async function detectInitialLocale(
    supported: readonly string[],
    fallback = 'en'
): Promise<string> {
    // Persisted user choice always wins.
    const persisted = pickSupported([readPersistedLocale()], supported);
    if (persisted) return persisted;

    // Native device locale beats browser locale on Capacitor platforms.
    if (Capacitor.isNativePlatform()) {
        try {
            const { Device } = await import('@capacitor/device');
            const { value } = await Device.getLanguageCode();
            const native = pickSupported([value], supported);
            if (native) return native;
        } catch {
            // Capacitor Device plugin missing or threw — fall through to web chain.
        }
    }

    return (
        pickSupported([readBrowserLocale()], supported) ??
        pickSupported([readTenantDefaultLocale()], supported) ??
        fallback
    );
}
