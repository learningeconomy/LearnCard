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
import {
    setLocale as paraglideSetLocale,
    getLocale,
} from '../paraglide/runtime.js';

// MessagePart is a JSDoc typedef in runtime.js, not a TS export.
// Define it here so our renderParts() helper is type-safe.
export type MessagePart =
    | { type: 'text'; value: string }
    | { type: 'markup-start'; name: string; options: Record<string, never>; attributes: Record<string, never> }
    | { type: 'markup-end'; name: string; options: Record<string, never>; attributes: Record<string, never> }
    | { type: 'markup-standalone'; name: string; options: Record<string, never>; attributes: Record<string, never> };

// ── Supported languages (mirrors LC-1831 POC) ──────────────────────────

export const SUPPORTED_LANGUAGES = ['en', 'es', 'de', 'ar'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Soft-RTL mode: keep layout LTR for all languages; only <html lang> changes.
export const RTL_LANGUAGES = new Set<SupportedLanguage>();

// ── React locale context ───────────────────────────────────────────────

type LocaleContextValue = {
    locale: SupportedLanguage;
    changeLocale: (lang: SupportedLanguage) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Reads the current locale from the Paraglide runtime and localStorage.
 * Used to initialise the React state so the first render matches.
 */
function resolveInitialLocale(): SupportedLanguage {
    // 1. Check localStorage (our own key, independent of Paraglide's strategy)
    if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('i18n.language');
        if (stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored)) {
            return stored as SupportedLanguage;
        }
    }
    // 2. Fall back to Paraglide's getLocale() (baseLocale = 'en')
    const gl = getLocale();
    if ((SUPPORTED_LANGUAGES as readonly string[]).includes(gl)) {
        return gl as SupportedLanguage;
    }
    return 'en';
}

/**
 * Wraps the app to provide locale state. Must sit above any component
 * that calls useLocale() or imports Paraglide messages.
 */
export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [locale, setLocaleState] = useState<SupportedLanguage>(resolveInitialLocale);

    const changeLocale = useCallback((lang: SupportedLanguage) => {
        // 1. Persist to localStorage
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('i18n.language', lang);
        }
        // 2. Update Paraglide's internal _locale (no page reload)
        paraglideSetLocale(lang, { reload: false });
        // 3. Trigger React re-render
        setLocaleState(lang);
    }, []);

    // Sync <html dir> and <html lang> on locale change
    useEffect(() => {
        document.documentElement.setAttribute('dir', RTL_LANGUAGES.has(locale) ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', locale);
    }, [locale]);

    return (
        <LocaleContext.Provider value={{ locale, changeLocale }}>
            {children}
        </LocaleContext.Provider>
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
    components: Record<string, React.ReactElement>,
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
                ? React.cloneElement(el, { key: `m-${frame.name}-${keyCounter++}` }, ...frame.children)
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
