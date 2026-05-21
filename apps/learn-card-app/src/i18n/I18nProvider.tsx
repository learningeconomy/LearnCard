import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RTL_LANGUAGES, type SupportedLanguage } from './index';

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { i18n } = useTranslation();
    useEffect(() => {
        const lang = i18n.language as SupportedLanguage;
        document.documentElement.setAttribute('dir', RTL_LANGUAGES.has(lang) ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', lang);
    }, [i18n.language]);
    return <>{children}</>;
};
