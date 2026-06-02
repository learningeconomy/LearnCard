import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import enResource from '../../public/locales/en/translation.json'; // synchronous EN

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
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: 'i18n.language',
            caches: ['localStorage'],
        },
        interpolation: { escapeValue: false },
        returnNull: false,
        // FLASH-OF-KEY MITIGATION 3: Suspense; component suspends until namespace ready.
        react: { useSuspense: true },
    });

export default i18next;
