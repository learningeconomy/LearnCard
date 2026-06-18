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
    'verification.selfIssued': 'Self Issued',
    'verification.trustedIssuer': 'Trusted Issuer',
    'verification.unknownIssuer': 'Unknown Issuer',
    'verification.appIssuer': 'App Issuer',
    'verification.untrustedIssuer': 'Untrusted Issuer',
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
            return localStorage.getItem('i18n.language') || 'en';
        }
    } catch {
        // localStorage may be unavailable (native/SSR) — default to English.
    }
    return 'en';
};

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
