import React, { useMemo } from 'react';
import { IonCol, IonRow } from '@ionic/react';
import { useModal } from 'learn-card-base';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import { BoostUserTypeEnum, boostVCTypeOptions } from '../../../boost-options/boostOptions';
import BoostVCTypeOptionButton from '../../../boost-options/boostVCTypeOptions/BoostVCTypeOptionButton';
import { StylePackCategories } from './BoostCMSAppearanceBadgeList';
import { SetState } from '@learncard/helpers';
import useHighlightedCredentials from 'apps/scouts/src/hooks/useHighlightedCredentials';
import { useFlags } from 'launchdarkly-react-client-sdk';

export interface StylePackCategoryModalProps {
    activeStylePackCategory: StylePackCategories;
    setActiveStylePackCategory: SetState<StylePackCategories>;
    boostUserType: BoostUserTypeEnum;
    targetType?: string;
}

export const StylePackCategoryModal: React.FC<StylePackCategoryModalProps> = ({
    activeStylePackCategory,
    setActiveStylePackCategory,
    boostUserType,
    targetType,
}) => {
    const { closeModal } = useModal();
    const flags = useFlags();
    const { credentials } = useHighlightedCredentials();

    // Check if user is Global Admin or National Admin
    const isAdmin = credentials.some(cred => {
        const subject = cred?.credentialSubject;
        if (!subject || Array.isArray(subject)) return false;
        return ['ext:GlobalID', 'ext:NetworkID'].includes(
            subject?.achievement?.achievementType
        );
    });

    const handleSelectCategory = (category: StylePackCategories) => {
        setActiveStylePackCategory(category);
        closeModal();
    };

    let boostOptions = boostVCTypeOptions[boostUserType];
    // Allow admins to bypass CMS customization restrictions
    if (flags?.disableCmsCustomization && !isAdmin) {
        boostOptions = boostVCTypeOptions?.[boostUserType].filter(
            item => item.title === targetType
        );
    }



    return (
        <div className="w-full">
            <header className="flex items-center justify-start ion-padding">
                <button
                    onClick={closeModal}
                    className="flex items-center mr-3 mt-1"
                    aria-label="Close modal"
                >
                    <CaretLeft className="text-grayscale-900 h-4 w-auto" />
                </button>
                <h1 className="text-grayscale-900 text-[22px] font-notoSans">
                    Select a Category
                </h1>
            </header>

            <div className="flex flex-col items-center justify-between w-full bg-grayscale-100 rounded-t-[20px] pt-4">
                <div className="w-full px-4 pb-[20px]">
                    {/* All option */}
                    <button
                        onClick={() => handleSelectCategory(StylePackCategories.all)}
                        className={`w-full flex items-center justify-between rounded-full p-2 mt-4 shadow-sm hover:shadow-md transition-shadow ${
                            activeStylePackCategory === StylePackCategories.all
                                ? 'border-2 border-emerald-700 bg-emerald-50'
                                : 'bg-white border-2 border-transparent'
                        }`}
                        aria-pressed={activeStylePackCategory === StylePackCategories.all}
                    >
                        <div className="flex items-center flex-1 min-w-0">
                            <div className="flex flex-col min-w-0 ml-10">
                                <h3 className="text-left font-semibold text-grayscale-900 uppercase text-xs font-notoSans">
                                    All
                                </h3>
                                <p className="text-[17px] text-grayscale-900 font-normal text-left">
                                    All Categories
                                </p>
                            </div>
                        </div>

                        {activeStylePackCategory === StylePackCategories.all && (
                            <div className="ml-2 shrink-0 flex items-center justify-center rounded-full bg-emerald-700 p-1">
                                <Checkmark className="text-white h-6 w-6" aria-hidden="true" />
                            </div>
                        )}
                    </button>

                    {/* Category options */}
                    {boostOptions.map(({
                        id,
                        IconComponent,
                        iconCircleClass,
                        iconClassName,
                        title,
                        type,
                    }) => {
                        const isActive = (activeStylePackCategory as string) === type;

                        return (
                            <button
                                key={id}
                                onClick={() => handleSelectCategory(type as unknown as StylePackCategories)}
                                className={`w-full flex items-center justify-between rounded-full p-2 mt-4 shadow-sm hover:shadow-md transition-shadow ${
                                    isActive
                                        ? 'border-2 border-emerald-700 bg-emerald-50'
                                        : 'bg-white border-2 border-transparent'
                                }`}
                                aria-pressed={isActive}
                            >
                                <div className="flex items-center flex-1 min-w-0">
                                    <div className={`flex items-center justify-center h-[40px] w-[40px] rounded-full shrink-0 ${iconCircleClass}`}>
                                        <IconComponent className={iconClassName} />
                                    </div>
                                    <div className="flex flex-col min-w-0 ml-2">
                                        <h3 className="text-left font-semibold text-grayscale-900 uppercase text-xs font-notoSans">
                                            {title}
                                        </h3>
                                        <p className="text-[17px] text-grayscale-900 font-normal text-left">
                                            {title} Style Packs
                                        </p>
                                    </div>
                                </div>

                                {isActive && (
                                    <div className="ml-2 shrink-0 flex items-center justify-center rounded-full bg-emerald-700 p-1">
                                        <Checkmark className="text-white h-6 w-6" aria-hidden="true" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default StylePackCategoryModal;
