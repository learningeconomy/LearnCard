import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import enResource from '../../public/locales/en/translation.json'; // synchronous EN

import { detectInitialLocale } from './detectLocale';

export const SUPPORTED_LANGUAGES = ['en', 'es', 'de', 'ar', 'fr', 'ko'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Full-RTL mode (re-enabled for screen-recording demo 2026-05-26): Arabic
// flips the entire layout via <html dir="rtl">. To revert to soft-RTL
// (layout stays LTR; only <html lang> changes; browser bidi handles Arabic
// character direction within text nodes), set this back to an empty Set.
export const RTL_LANGUAGES = new Set<SupportedLanguage>(['ar']);

void i18next
    .use(HttpBackend) // for lazy-loading ES/FR/AR only
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        // FLASH-OF-KEY MITIGATION 1: synchronously bundle EN. No async window for default locale.
        resources: { en: { translation: enResource } },
        partialBundledLanguages: true,
        fallbackLng: 'en',
        supportedLngs: SUPPORTED_LANGUAGES,
        load: 'languageOnly',
        defaultNS: 'translation',
        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
        detection: {
            // Sync detection chain. Capacitor `Device.getLanguageCode()` is
            // async and isn't available here — it runs in the bootstrap path
            // (index.tsx) after i18next has initialised, then upgrades the
            // active language via `i18n.changeLanguage()` if the user hasn't
            // already picked one manually.
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: 'i18n.language',
            caches: ['localStorage'],
        },
        interpolation: { escapeValue: false },
        returnNull: false,
        // FLASH-OF-KEY MITIGATION 3: Suspense; component suspends until namespace ready.
        react: { useSuspense: true },
    });

/**
 * After i18next has booted (init is non-blocking but synchronous-enough for
 * EN to render), run the async detection chain to pick up Capacitor
 * `Device.getLanguageCode()` on native platforms and switch to it if the user
 * hasn't manually selected anything.
 *
 * Call this from bootstrap (after `bootstrapTenantConfig()` has seeded the
 * tenant-default cache via `setTenantDefaultLocaleCache`).
 */
export async function upgradeToNativeLocale(): Promise<void> {
    // If the user has a persisted choice, the sync detector already honored
    // it during i18next init. Don't override.
    if (
        typeof localStorage !== 'undefined' &&
        localStorage.getItem('i18n.language')
    ) {
        return;
    }
    try {
        const detected = await detectInitialLocale(SUPPORTED_LANGUAGES, 'en');
        if (
            detected !== i18next.language &&
            (SUPPORTED_LANGUAGES as readonly string[]).includes(detected)
        ) {
            // Don't persist (caches: ['localStorage'] would, but only if we go
            // through changeLanguage()) — we DO want the user's auto-detected
            // choice to persist so app re-launches see it as their default, AND
            // so the upgrade only runs once per session.
            await i18next.changeLanguage(detected);
        }
    } catch {
        // Native locale read failed; stick with the sync-detected language.
    }
}

export default i18next;
