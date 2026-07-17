/**
 * i18n — Paraglide-based locale management
 *
 * Replaces the react-i18next initialization from the LC-1831 POC.
 * Paraglide compiles messages from our existing JSON translation files
 * (via @inlang/plugin-i18next) into tree-shakable TS functions in
 * ../paraglide/messages.js. Components import * as m and call
 * m.someKey() directly — no hook needed for message resolution.
 *
 * For locale switching, we provide a lightweight React context that
 * re-renders consumers when setLocale() is called. This avoids the
 * full page reload that Paraglide's default setLocale triggers.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { setLocale as paraglideSetLocale, getLocale } from '../paraglide/runtime.js';

import { detectInitialLocale, detectInitialLocaleSync } from './detectLocale';

// Mirror of Paraglide's runtime `MessagePart` (a JSDoc typedef in
// ../paraglide/runtime.js, not a TS export). Field types match the generated
// runtime exactly — `options` is MessageMarkupOptions (Record<string, unknown>)
// and `attributes` is MessageMarkupAttributes (Record<string, string | true>) —
// so a message's `.parts()` output is assignable to renderParts() without a cast.
type MarkupOptions = Record<string, unknown>;
type MarkupAttributes = Record<string, string | true>;
export type MessagePart =
    | { type: 'text'; value: string }
    | { type: 'markup-start'; name: string; options: MarkupOptions; attributes: MarkupAttributes }
    | { type: 'markup-end'; name: string; options: MarkupOptions; attributes: MarkupAttributes }
    | {
          type: 'markup-standalone';
          name: string;
          options: MarkupOptions;
          attributes: MarkupAttributes;
      };

// ── Supported languages (mirrors LC-1831 POC) ──────────────────────────

export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'ar'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Full RTL mode for Arabic: flips <html dir="rtl"> so the layout mirrors.
// Set back to `new Set<SupportedLanguage>()` to revert to soft-RTL
// (Unicode bidi handles Arabic text but layout stays LTR).
export const RTL_LANGUAGES = new Set<SupportedLanguage>(['ar']);

// ── React locale context ───────────────────────────────────────────────

type LocaleContextValue = {
    locale: SupportedLanguage;
    changeLocale: (lang: SupportedLanguage) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Synchronously resolves the initial locale. Used as the `useState` initializer
 * so first render already matches the detected locale (no flash of EN).
 *
 * Priority chain (highest first):
 *   1. localStorage `i18n.language` — manual user choice persists
 *   2. `navigator.language` — browser/system locale on web
 *   3. tenant `i18n.defaultLanguage` — set via `setTenantDefaultLocaleCache()`
 *      from `TenantConfigProvider` before React mounts
 *   4. `'en'` — hard fallback
 *
 * Native device locale (Capacitor `Device.getLanguageCode()`) is async and
 * handled in the effect below — it takes priority over (2)/(3) but slots in
 * after first render when running on iOS/Android.
 */
function resolveInitialLocale(): SupportedLanguage {
    const detected = detectInitialLocaleSync(SUPPORTED_LANGUAGES, 'en');
    // Paraglide's getLocale() is the runtime baseLocale (typically 'en'). If the
    // sync chain returned that and it's a no-op, prefer Paraglide's own value
    // so any future server-side strategy stays consistent.
    if (detected === 'en') {
        const gl = getLocale();
        if ((SUPPORTED_LANGUAGES as readonly string[]).includes(gl)) {
            return gl as SupportedLanguage;
        }
    }
    return detected as SupportedLanguage;
}

/**
 * Wraps the app to provide locale state. Must sit above any component
 * that calls useLocale() or imports Paraglide messages.
 *
 * Native locale upgrade: on Capacitor platforms we run an async
 * `detectInitialLocale()` once after mount, which reads
 * `Device.getLanguageCode()`. If the result differs from the sync-detected
 * locale AND the user hasn't manually picked anything yet (no localStorage
 * entry), we upgrade to the native choice. Manual picks always win on
 * subsequent launches.
 */
export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [locale, setLocaleState] = useState<SupportedLanguage>(() => {
        const initial = resolveInitialLocale();
        paraglideSetLocale(initial, { reload: false });
        return initial;
    });
    const changeLocale = useCallback((lang: SupportedLanguage) => {
        // 1. Switch in-memory FIRST so a storage failure can never abort the
        //    actual locale change. localStorage.setItem throws (SecurityError) in
        //    private/restricted contexts; if that ran first and threw, the user
        //    would be stuck in the old locale.
        paraglideSetLocale(lang, { reload: false });
        setLocaleState(lang);

        // 2. Best-effort persistence — never fatal to the switch above.
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem('i18n.language', lang);
            } catch {
                // Private mode / storage disabled — the choice just won't persist
                // across reloads. The in-memory switch already succeeded.
            }
        }
    }, []);

    // First-launch native-locale upgrade. Only runs if the user hasn't yet
    // manually picked a locale (i.e. no localStorage entry) — once a choice is
    // persisted, we never override it from autodetection on later launches.
    useEffect(() => {
        const hasManualChoice =
            typeof localStorage !== 'undefined' && !!localStorage.getItem('i18n.language');
        if (hasManualChoice) return;
        void detectInitialLocale(SUPPORTED_LANGUAGES, 'en').then(detected => {
            if (
                detected !== locale &&
                (SUPPORTED_LANGUAGES as readonly string[]).includes(detected)
            ) {
                // Don't persist (we don't want to record an auto choice as a
                // manual one — that would block future re-detection if the user
                // moves device locales).
                paraglideSetLocale(detected as SupportedLanguage, { reload: false });
                setLocaleState(detected as SupportedLanguage);
            }
        });
        // Intentionally only runs once on mount; `locale` is captured at first
        // render and that's the comparison we want.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync <html dir> and <html lang> on locale change
    useEffect(() => {
        document.documentElement.setAttribute('dir', RTL_LANGUAGES.has(locale) ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', locale);
    }, [locale]);

    return (
        <LocaleContext.Provider value={{ locale, changeLocale }}>{children}</LocaleContext.Provider>
    );
};

/**
 * Hook to read the current locale. Returns the locale string.
 * Use this when you need the locale value but don't need to change it.
 */
export function useLocale(): SupportedLanguage {
    const ctx = useContext(LocaleContext);
    if (!ctx) throw new Error('useLocale() must be used inside <LocaleProvider>');
    return ctx.locale;
}

/**
 * Hook to change the current locale. Returns a stable setter function.
 */
export function useChangeLocale(): (lang: SupportedLanguage) => void {
    const ctx = useContext(LocaleContext);
    if (!ctx) throw new Error('useChangeLocale() must be used inside <LocaleProvider>');
    return ctx.changeLocale;
}

// ── <Trans> / markup-part rendering helper ─────────────────────────────

/**
 * Renders a sequence of message parts (from Paraglide's .parts() method)
 * into React elements.
 *
 * Usage:
 *   const parts = m['sidemenu.footer.poweredBy'].parts();
 *   return renderParts(parts, { '0': <span className="font-semibold" /> });
 *
 * Each named markup span wraps its children in the provided React element
 * (cloned with a key). Text nodes are rendered as plain strings / fragments.
 */
export function renderParts(
    parts: MessagePart[],
    components: Record<string, React.ReactElement>
): React.ReactNode {
    const result: React.ReactNode[] = [];
    const stack: { name: string; children: React.ReactNode[] }[] = [];
    let keyCounter = 0;

    for (const part of parts) {
        if (part.type === 'text') {
            const node = part.value;
            if (stack.length > 0) {
                stack[stack.length - 1].children.push(node);
            } else {
                result.push(node);
            }
        } else if (part.type === 'markup-start') {
            stack.push({ name: part.name, children: [] });
        } else if (part.type === 'markup-end') {
            const frame = stack.pop();
            if (!frame) {
                // Mismatched tags — fall back to raw text
                continue;
            }
            const el = components[frame.name];
            const child = el
                ? React.cloneElement(
                      el,
                      { key: `m-${frame.name}-${keyCounter++}` },
                      ...frame.children
                  )
                : frame.children;
            if (stack.length > 0) {
                stack[stack.length - 1].children.push(child);
            } else {
                result.push(child);
            }
        }
    }

    // Flush any unterminated tags (fallback)
    while (stack.length > 0) {
        const frame = stack.pop()!;
        result.push(frame.children);
    }

    if (result.length === 1) return result[0];
    return React.createElement(React.Fragment, null, ...result);
}
