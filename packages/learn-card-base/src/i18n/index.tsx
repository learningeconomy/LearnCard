/**
 * Lightweight i18n adapter for `learn-card-base`.
 *
 * This package is shared across multiple apps (learn-card-app, scouts) which
 * each own their own translation catalog, so we can't bake any single app's
 * i18n in here. Instead components call `useT()` and resolve strings through a
 * host-supplied resolver. With NO provider mounted, `useT()` returns the
 * co-located English default — so the package always renders (English) when
 * used standalone, in tests, or in Storybook.
 *
 * The host app mounts `<I18nProvider resolve={fn} locale={locale}>` where `fn`
 * delegates to the app's own catalog (e.g. Paraglide). Passing the active
 * `locale` into the provider value forces this subtree to re-render on switch.
 *
 * See: Claude Notes/LearnCard/2026-06-17-localizing-shared-packages-base-and-react-sdk.md
 */
import React, { createContext, useCallback, useContext, useMemo } from 'react';

export type I18nResolver = (key: string, params?: Record<string, unknown>) => string | undefined;

type I18nContextValue = { resolve: I18nResolver; locale: string };

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * English defaults, co-located with the package. One entry per extracted
 * string. Keys are unprefixed here; the host app namespaces them (e.g. `base.`)
 * inside its own catalog/resolver.
 */
export const EN_DEFAULTS: Record<string, string> = {
    'common.close': 'Close',
    'common.select': 'Select',
    'verification.selfIssued': 'Self Issued',
    'verification.trustedIssuer': 'Trusted Issuer',
    'verification.unknownIssuer': 'Unknown Issuer',
    'verification.appIssuer': 'App Issuer',
    'verification.untrustedIssuer': 'Untrusted Issuer',
    'credential.lifecycle.revoked': 'Revoked',
    'credential.lifecycle.suspended': 'Suspended',
    'boostFooter.close': 'Close',
    'boostFooter.back': 'Back',
    'boostFooter.details': 'Details',
    'boostFooter.share': 'Share',
    'boostFooter.accept': 'Accept',
};

/**
 * The user's active language as a plain BCP-47 string, read from the same
 * localStorage key the app's i18n writes (`i18n.language`). For non-React call
 * sites (network mutations, WebSocket setup) that need to tell the backend
 * which language to generate AI content in (LC-1901). Falls back to `'en'`.
 */
export const getActiveLocale = (): string => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem('i18n.language');
            if (raw) {
                // Strip anything that isn't a valid BCP-47 character (alphanumeric +
                // hyphen) before this value is sent to the backend. A crafted
                // localStorage entry — e.g. via XSS — must not be able to alter
                // request parameters. An all-invalid value collapses to 'en'.
                return raw.replace(/[^a-zA-Z0-9-]/g, '') || 'en';
            }
        }
    } catch {
        // localStorage may be unavailable or no manual choice may exist.
    }

    try {
        const liveLocale =
            typeof document !== 'undefined' ? document.documentElement?.lang : undefined;
        if (liveLocale) return liveLocale.replace(/[^a-zA-Z0-9-]/g, '') || 'en';
    } catch {
        // document may be unavailable (native/SSR) — default to English.
    }
    return 'en';
};
// NOTE: the `document.documentElement.lang` step above is not a vestigial
// fallback — it is what covers every case where the user never *chose* a
// language (browser autodetect, tenant default, profile restore), since those
// don't write `i18n.language`. It stays correct only because `LocaleProvider`
// syncs `<html lang>` on each locale change (apps/learn-card-app/src/i18n/
// index.tsx). Drop that effect and AI responses silently revert to English for
// autodetected users, with no test failing.

/**
 * Add the active UI locale to an AI service URL without unsafe string interpolation.
 *
 * Returns the URL untouched if it can't be parsed. `new URL()` throws a
 * `TypeError` on a relative or empty base, and `aiServiceUrl` is tenant-supplied
 * (`apis.aiService`) and read at call time, so it isn't guaranteed absolute. Some
 * call sites sit inside handlers where a throw does collateral damage — the
 * `visibilitychange` beacon in `LearnCardAiChatBot` would lose its hidden-timer
 * bookkeeping, not just one request. Locale enrichment is an enhancement; it must
 * never be the reason a request fails to go out.
 */
export const addActiveLocaleToUrl = (url: string): string => {
    try {
        const parsedUrl = new URL(url);
        parsedUrl.searchParams.set('locale', getActiveLocale());
        return parsedUrl.toString();
    } catch {
        return url;
    }
};

/** Add the active UI locale to a WebSocket payload without mutating the input. */
export const addActiveLocaleToPayload = <Payload extends object>(
    payload: Payload
): Payload & { locale: string } => ({ ...payload, locale: getActiveLocale() });

/** Minimal `{var}` interpolation — no dependency. */
const interpolate = (str: string, params?: Record<string, unknown>): string =>
    params
        ? str.replace(/\{(\w+)\}/g, (_, k) => (params[k] != null ? String(params[k]) : `{${k}}`))
        : str;

export const I18nProvider: React.FC<{
    resolve: I18nResolver;
    locale: string;
    children: React.ReactNode;
}> = ({ resolve, locale, children }) => {
    const value = useMemo<I18nContextValue>(() => ({ resolve, locale }), [resolve, locale]);
    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

/**
 * Returns a translate function. Resolution order:
 *   1. host resolver (app catalog) if a provider is mounted and has the key
 *   2. co-located English default (interpolated)
 *   3. the key itself (last-resort, surfaces missing keys in dev)
 */
export const useT = (): ((key: string, params?: Record<string, unknown>) => string) => {
    const ctx = useContext(I18nContext);
    return useCallback(
        (key: string, params?: Record<string, unknown>) => {
            const fromHost = ctx?.resolve(key, params);
            if (fromHost != null) return fromHost;
            const def = EN_DEFAULTS[key];
            return def != null ? interpolate(def, params) : key;
        },
        [ctx]
    );
};
