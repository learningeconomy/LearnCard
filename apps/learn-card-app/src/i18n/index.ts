import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import enResource from '../../public/locales/en/translation.json'; // synchronous EN

export const SUPPORTED_LANGUAGES = ['en', 'es', 'de', 'ar'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Soft-RTL mode: keep layout LTR for all languages; only the <html lang>
// attribute changes. The browser's Unicode bidirectional algorithm renders
// Arabic letters in their correct direction within text nodes automatically,
// without flipping the entire app layout. Set to a non-empty set (e.g.
// new Set(['ar'])) to opt back into full layout flip.
export const RTL_LANGUAGES = new Set<SupportedLanguage>();

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
