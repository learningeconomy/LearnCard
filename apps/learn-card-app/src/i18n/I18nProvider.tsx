import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RTL_LANGUAGES, type SupportedLanguage } from './index';

/**
 * Sets <html dir> and <html lang> in response to language changes.
 *
 * Currently runs in "soft-RTL" mode: Arabic is NOT in RTL_LANGUAGES, so the
 * direction stays 'ltr' regardless of language. Only `lang` is updated, which
 * is enough for the browser's Unicode bidi algorithm to render Arabic text
 * correctly within LTR-laid-out blocks. The full layout flip path is preserved
 * — to enable it, add 'ar' to RTL_LANGUAGES in ./index.ts.
 */
export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { i18n } = useTranslation();
    useEffect(() => {
        const lang = i18n.language as SupportedLanguage;
        document.documentElement.setAttribute('dir', RTL_LANGUAGES.has(lang) ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', lang);
    }, [i18n.language]);
    return <>{children}</>;
};
