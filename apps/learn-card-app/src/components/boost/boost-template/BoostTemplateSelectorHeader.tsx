import React from 'react';
import { BoostPageViewMode, ModalTypes, useModal, CredentialCategoryEnum } from 'learn-card-base';

import CaretDown from 'learn-card-base/svgs/CaretDown';
import BoostSelectCategoryMenu from '../boost-select-menu/BoostSelectCategoryMenu';

import {
    BoostCategoryOptionsEnum,
    boostCategoryOptions,
    boostVCTypeOptions,
} from '../boost-options/boostOptions';

import type { SetState } from '@learncard/helpers';
import { BoostPageViewModeType, BoostUserTypeEnum } from 'learn-card-base';

import useTheme from '../../../theme/hooks/useTheme';

type BoostTemplateSelectorHeaderProps = {
    selectedCategory: BoostCategoryOptionsEnum;
    setSelectedCategory: SetState<BoostCategoryOptionsEnum>;
    viewMode: BoostPageViewModeType;
    setViewMode: SetState<BoostPageViewModeType>;
};

const BoostTemplateSelectorHeader: React.FC<BoostTemplateSelectorHeaderProps> = ({
    selectedCategory,
    setSelectedCategory,
    viewMode,
    setViewMode,
}) => {
    const { getThemedCategoryIcons } = useTheme();

    const { newModal, closeModal } = useModal();

    const { title, lightColor } = boostCategoryOptions?.[selectedCategory];
    const { IconWithShape, Icon } = getThemedCategoryIcons?.(selectedCategory);

    const { IconWithShape: AllIconWithShape } =
        boostCategoryOptions?.[BoostCategoryOptionsEnum.all];

    const boostUserType = BoostUserTypeEnum.someone;
    const boostDropdownCategoryOptions = boostVCTypeOptions[boostUserType];

    const isCard = viewMode === BoostPageViewMode.Card;
    const isList = viewMode === BoostPageViewMode.List;

    return (
        <div className="bg-white pl-[10px] pr-[20px] py-[10px] rounded-b-[20px] shadow-header">
            <div className="max-w-[600px] flex items-center justify-between mx-auto">
                <button
                    className="flex items-center gap-[10px] w-full"
                    onClick={() => {
                        newModal(
                            <BoostSelectCategoryMenu
                                onClick={setSelectedCategory}
                                closeModal={closeModal}
                                selectedBoostType={selectedCategory}
                                categories={boostDropdownCategoryOptions}
                            />,
                            {
                                sectionClassName: '!max-w-[500px]',
                            },
                            {
                                desktop: ModalTypes.Cancel,
                                mobile: ModalTypes.Cancel,
                            }
                        );
                    }}
                >
                    {selectedCategory === BoostCategoryOptionsEnum.all ? (
                        <div className={`bg-${lightColor} rounded-full p-[10px]`}>
                            <AllIconWithShape className="h-[45px] w-[45px]" />
                        </div>
                    ) : (
                        <div className={`bg-${lightColor} rounded-full p-[10px]`}>
                            {IconWithShape ? (
                                <IconWithShape className="h-[45px] w-[45px]" />
                            ) : (
                                <Icon className="h-[45px] w-[45px]" />
                            )}
                        </div>
                    )}

                    {/* Make sure tailwind generates these bg classes */}
                    <div className="hidden bg-pink-200 bg-emerald-201 bg-yellow-200 bg-cyan-201" />

                    <div className="flex items-center gap-[3px] w-full">
                        <p className="font-poppins text-grayscale-800 text-[20px] leading-[130%] tracking-[-0.25px]">
                            {title}
                        </p>
                        <CaretDown className="text-grayscale-900 ml-auto" />
                    </div>
                </button>

                {/* <div className="rounded-full fix-ripple flex w-fit items-center shrink-0 bg-grayscale-100 h-[40px] border-[1px] border-solid border-grayscale-100">
                    <button
                        className={`rounded-full p-[10px] shrink-0 ${
                            isCard ? `bg-white iconColor` : 'text-white'
                        }`}
                        onClick={() => setViewMode(BoostPageViewMode.Card)}
                    >
                        <GridIcon
                            className={isCard ? 'text-grayscale-900' : 'text-grayscale-600'}
                        />
                    </button>
                    <button
                        className={`rounded-full p-[10px] shrink-0 ${
                            isList ? `bg-white iconColor` : 'text-white'
                        }`}
                        onClick={() => setViewMode(BoostPageViewMode.List)}
                    >
                        <ListItemsIcon
                            className={isList ? 'text-grayscale-900' : 'text-grayscale-600'}
                        />
                    </button>
                </div> */}
            </div>
        </div>
    );
};

export default BoostTemplateSelectorHeader;
