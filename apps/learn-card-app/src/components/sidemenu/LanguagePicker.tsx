import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../i18n';
import { useTheme } from '../../theme/hooks/useTheme';

const LANGUAGE_NATIVE_NAMES: Record<SupportedLanguage, string> = {
    en: 'English',
    es: 'Español',
    de: 'Deutsch',
    ar: 'العربية',
};

const LanguagePicker: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;
    const [isUpdating, setIsUpdating] = useState(false);

    const handleChange = async (lang: SupportedLanguage) => {
        setIsUpdating(true);
        await i18n.changeLanguage(lang);
        setIsUpdating(false);
    };

    const currentLang = i18n.language as SupportedLanguage;

    return (
        <div className="w-full px-4 mt-4">
            <div className="w-full flex items-center justify-center bg-grayscale-100 rounded-[16px] p-[2px]">
                {SUPPORTED_LANGUAGES.map(lang => {
                    const selected = currentLang === lang;
                    return (
                        <button
                            key={lang}
                            onClick={() => handleChange(lang)}
                            disabled={isUpdating}
                            aria-pressed={selected}
                            className={`flex-1 py-2.5 px-1 text-xs font-medium font-poppins rounded-full transition-colors
                                ${
                                    selected
                                        ? `bg-grayscale-900 text-white`
                                        : `text-grayscale-600 hover:text-grayscale-900`
                                }`}
                        >
                            {LANGUAGE_NATIVE_NAMES[lang]}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default LanguagePicker;
