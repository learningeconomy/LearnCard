import React from 'react';
import { useModal, ModalTypes } from 'learn-card-base';

import CaretDown from 'learn-card-base/svgs/CaretDown';
import Checkmark from 'learn-card-base/svgs/Checkmark';

import * as m from '../../paraglide/messages.js';
import { SUPPORTED_LANGUAGES, useLocale, useChangeLocale, type SupportedLanguage } from '../../i18n';

/**
 * Native names for every supported language, shown in their own script.
 * Add a row here when adding a new language to SUPPORTED_LANGUAGES.
 *
 * For scale: this list is rendered as a vertical scrollable list inside a
 * modal, so adding ~15 languages works without UX changes. Beyond that,
 * consider adding a search/filter input to the modal.
 */
const LANGUAGE_NATIVE_NAMES: Record<SupportedLanguage, string> = {
    en: 'English',
    es: 'Español',
    de: 'Deutsch',
    ar: 'العربية',
    fr: 'Français',
    ko: '한국어',
};

/**
 * Body of the language-selector modal. Renders each supported language as
 * a row; current language is highlighted with a checkmark.
 */
const LanguageSelectorModal: React.FC<{ currentLang: SupportedLanguage }> = ({ currentLang }) => {
    const changeLocale = useChangeLocale();
    const { closeModal } = useModal();

    const handlePick = (lang: SupportedLanguage) => {
        if (lang !== currentLang) {
            changeLocale(lang);
        }
        closeModal();
    };

    return (
        <div className="w-full flex flex-col px-4 py-2 gap-2">
            <h3 className="text-center font-poppins font-semibold text-[18px] text-grayscale-900 mb-1">
                {m['language.select']()}
            </h3>
            <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto">
                {SUPPORTED_LANGUAGES.map(lang => {
                    const selected = lang === currentLang;
                    return (
                        <button
                            key={lang}
                            type="button"
                            onClick={() => handlePick(lang)}
                            aria-pressed={selected}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-[12px] transition-colors text-left ${
                                selected ? 'bg-grayscale-100' : 'hover:bg-grayscale-50'
                            }`}
                        >
                            <span className="text-grayscale-900 font-poppins text-[15px]">
                                {LANGUAGE_NATIVE_NAMES[lang]}
                            </span>
                            {selected && (
                                <Checkmark className="w-5 h-5 text-emerald-500 shrink-0" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

/**
 * Side-menu language trigger. Shows the current language plus a caret;
 * tapping opens a modal that lists every supported language.
 *
 * Scales to many more languages than the previous inline-buttons design,
 * which capped out around 4-5 entries before overflowing the sidebar.
 */
const LanguagePicker: React.FC = () => {
    const currentLang = useLocale();
    const { newModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const currentLabel = LANGUAGE_NATIVE_NAMES[currentLang] ?? LANGUAGE_NATIVE_NAMES.en;

    const openLanguageModal = () => {
        newModal(
            <LanguageSelectorModal currentLang={currentLang} />,
            { sectionClassName: '!max-w-[420px]' },
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
        );
    };

    return (
        <div className="w-full px-4 mt-4">
            <button
                type="button"
                onClick={openLanguageModal}
                className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-[16px] shadow-soft-bottom"
                aria-label={currentLabel}
            >
                <span className="text-grayscale-900 font-poppins text-[15px] font-medium">
                    {currentLabel}
                </span>
                <CaretDown className="w-4 h-4 text-grayscale-600 shrink-0" />
            </button>
        </div>
    );
};

export default LanguagePicker;
