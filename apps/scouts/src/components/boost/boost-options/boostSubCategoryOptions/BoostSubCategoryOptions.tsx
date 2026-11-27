import type { NavigateFunction } from 'react-router';
import React, { useState } from 'react';
import { z } from 'zod';
import { useFlags } from 'launchdarkly-react-client-sdk';

import CaretLeft from '../../../svgs/CaretLeft';
import BoostSubCategoryButton from './BoostSubCategoryButton';

import {
    BoostUserTypeEnum,
    CATEGORY_TO_SUBCATEGORY_LIST,
    boostCategoryOptions,
} from '../boostOptions';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import {
    BoostCategoryOptionsEnum,
    CUSTOM_BOOST_TYPE_REGEX,
    constructCustomBoostType,
} from 'learn-card-base';
import X from 'learn-card-base/svgs/X';
import * as m from '../../../../paraglide/messages.js';
import { useLocale } from '../../../../i18n';
import { AppContent, AppHeader, AppToolbar } from 'learn-card-base/ui/chrome';
import { AppInput } from 'learn-card-base/ui/controls/AppInput';
import { AppCol, AppGrid, AppRow } from 'learn-card-base/ui/layout';

const StateValidator = z.object({
    customType: z
        .string()
        .min(3)
        .max(22)
        .regex(CUSTOM_BOOST_TYPE_REGEX, ' Alphabetical characters only'),
});

type BoostSubCategoryOptionsProps = {
    closeAllModals: () => void;
    handleCloseModal: () => void;
    boostUserType: BoostUserTypeEnum;
    boostCategoryType: BoostCategoryOptionsEnum;
    setSelectedCategoryType: React.Dispatch<React.SetStateAction<string | null>>;
    otherUserProfileId?: string;
    hideBackButton: boolean;
    showCloseButton: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
    history: NavigateFunction;
};

export const BoostSubCategoryOptions: React.FC<BoostSubCategoryOptionsProps> = ({
    closeAllModals,
    handleCloseModal,
    boostUserType = BoostUserTypeEnum.someone,
    boostCategoryType,
    setSelectedCategoryType,
    otherUserProfileId = '',
    hideBackButton,
    showCloseButton,
    history,
}) => {
    const locale = useLocale();

    const flags = useFlags();
    const [customBoostType, setCustomBoostType] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const charCount = 22 - customBoostType.length;

    const { color, subColor, title, CategoryImage } = boostCategoryOptions[boostCategoryType];

    const subCategoryTypes = [...CATEGORY_TO_SUBCATEGORY_LIST[boostCategoryType]].sort((a, b) =>
        a.title.localeCompare(b.title, locale)
    );

    const boostOptionsItemList = subCategoryTypes?.map(({ title, type }, index) => {
        return (
            <BoostSubCategoryButton
                key={index}
                title={title}
                boostCategoryType={boostCategoryType}
                subCategoryType={type}
                boostUserType={boostUserType}
                setSelectedCategoryType={setSelectedCategoryType}
                closeAllModals={closeAllModals}
                otherUserProfileId={otherUserProfileId}
                history={history}
            />
        );
    });
    const validate = (): boolean => {
        const parsedData = StateValidator.safeParse({ customType: customBoostType });

        if (parsedData.success) {
            setErrors({});
            return true;
        }

        setErrors(parsedData.error.flatten().fieldErrors);
        return false;
    };

    const handleCustomBoostType = (): void => {
        if (!validate()) return;

        const customType = constructCustomBoostType(boostCategoryType, customBoostType);
        const baseLink = `/boost?boostUserType=${boostUserType}&boostCategoryType=${boostCategoryType}&boostSubCategoryType=${customType}`;
        const link = otherUserProfileId
            ? `${baseLink}&otherUserProfileId=${otherUserProfileId}`
            : baseLink;

        history(link);
        closeAllModals();
    };

    const _subCategoryColor = `bg-${subColor}`;

    return (
        <section className="h-full">
            <AppContent fullscreen color={subColor}>
                <AppHeader className={`ion-no-border pt-10 ${_subCategoryColor}`}>
                    <AppToolbar color="#fffff">
                        <AppRow className="flex flex-col pb-4">
                            {/* {showCloseButton && ( */}
                            <AppCol className="flex flex-1 justify-end items-center px-3">
                                <button className="z-[9999] pt-2" onClick={closeAllModals}>
                                    <X className="text-white h-8 w-8" />
                                </button>
                            </AppCol>
                            {/* )} */}
                            <AppCol className="w-full flex items-center justify-center mt-4">
                                <h6 className="flex items-center justify-center text-white text-3xl font-medium">
                                    {!hideBackButton && (
                                        <button
                                            className="text-grayscale-50 p-0 mr-[10px]"
                                            onClick={() => setSelectedCategoryType(null)}
                                        >
                                            <CaretLeft className="rtl-mirror h-auto w-3 text-white" />
                                        </button>
                                    )}
                                    {title}
                                </h6>
                            </AppCol>
                        </AppRow>
                        <AppRow className="flex items-center justify-center w-full mt-4">
                            <AppCol className="text-center">
                                <div className="relative flex flex-col items-center justify-center p-0 pb-0 rounded-3xl flex-1">
                                    <div
                                        className={`absolute top-0 left-[%50] w-[160px] h-[160px] bg-${color} rounded-full`}
                                    />
                                    <img
                                        src={CategoryImage}
                                        alt=""
                                        className="z-50 w-[150px] h-[151px] mt-4"
                                    />
                                </div>
                            </AppCol>
                        </AppRow>
                    </AppToolbar>
                </AppHeader>
                <AppGrid>
                    <AppRow className="w-full flex items-center justify-center pb-6">
                        {!flags?.disableCmsCustomization && (
                            <>
                                <div className="max-w-[95%] w-full ion-padding rounded-tr-[20px] rounded-tl-[20px] mb-0 relative">
                                    <AppInput
                                        autocapitalize="on"
                                        value={customBoostType}
                                        onValueInput={value => {
                                            setCustomBoostType(value ?? '');
                                            setErrors({});
                                        }}
                                        placeholder={m['boost.customTypePlaceholder']()}
                                        type="text"
                                        className={`bg-white text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base ${
                                            errors.customType ? 'border-red-500 border-2' : ''
                                        }`}
                                        maxlength={22}
                                    />
                                    <div className="flex items-center justify-center absolute top-[24px] right-[15px] z-50">
                                        <p className="mr-4 font-bold text-gray-500 text-xs">
                                            {charCount}
                                        </p>
                                        <button
                                            slot="end"
                                            className="bg-emerald-700 rounded-full min-h-[40px] min-w-[40px] flex items-center justify-center shadow-3xl mr-4"
                                            onClick={handleCustomBoostType}
                                        >
                                            <Checkmark
                                                className="text-white w-[30px]"
                                                strokeWidth="3"
                                            />
                                        </button>
                                    </div>
                                    <div className="w-full text-left">
                                        <p className="text-sm text-red-600 mt-2 ml-2 font-medium">
                                            {errors.customType}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center w-full">
                                    <div className="flex items-center justify-center w-full px-5 max-w-[95%]">
                                        <h2 className="divider-with-text-dynamic border-white border-solid border-b">
                                            <span className={`bg-${subColor} text-white`}>
                                                {m['boost.or']()}
                                            </span>
                                        </h2>
                                    </div>
                                </div>
                            </>
                        )}
                        <AppCol className="w-full flex flex-col items-center justify-center">
                            {boostOptionsItemList}
                        </AppCol>
                        <div className="w-full flex items-center justify-center mt-4">
                            <button
                                onClick={() => {
                                    if (hideBackButton) {
                                        closeAllModals();
                                    } else {
                                        setSelectedCategoryType(null);
                                    }
                                }}
                                className="text-white text-center text-sm"
                            >
                                {m['common.cancel']()}
                            </button>
                        </div>
                    </AppRow>
                </AppGrid>
            </AppContent>
        </section>
    );
};

export default BoostSubCategoryOptions;
