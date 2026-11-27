import React, { useState } from 'react';

import BoostVCTypeOptionButton from './BoostVCTypeOptionButton';
import BoostSubCategoryOptions from '../boostSubCategoryOptions/BoostSubCategoryOptions';
import MiniGhost from 'learn-card-base/assets/images/ghostboost.png';
import CaretLeft from '../../../svgs/CaretLeft';

import { boostVCTypeOptions, BoostUserTypeEnum } from '../boostOptions';
import { BoostCategoryOptionsEnum } from 'learn-card-base';
import * as m from '../../../../paraglide/messages.js';
import { AppContent, AppHeader, AppPage, AppToolbar } from 'learn-card-base/ui/chrome';
import { AppCol, AppGrid, AppRow } from 'learn-card-base/ui/layout';

type BoostVCTypeOptionsProps = {
    boostUserType: BoostUserTypeEnum;
    handleCloseModal: () => void;
    handleCloseUserOptionsModal: () => void;
    otherUserProfileId?: string;
    boostCategoryType?: BoostCategoryOptionsEnum;
    hideBackButton: boolean;
    showCloseButton: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
    history: any;
};

export const BoostVCTypeOptions: React.FC<BoostVCTypeOptionsProps> = ({
    handleCloseModal,
    handleCloseUserOptionsModal,
    boostUserType = BoostUserTypeEnum.someone,
    otherUserProfileId = '',
    boostCategoryType,
    hideBackButton,
    showCloseButton,
    history,
}) => {
    const [selectedCategoryType, setSelectedCategoryType] = useState<
        BoostCategoryOptionsEnum | string | null
    >(boostCategoryType ?? null);

    const title =
        boostUserType === BoostUserTypeEnum.self
            ? m['boost.yourselfExclamation']()
            : m['boost.someoneExclamation']();
    const boostOptions = boostVCTypeOptions[boostUserType];

    const subtext =
        boostUserType === BoostUserTypeEnum.self
            ? m['boost.selfSubtext']()
            : m['boost.someoneSubtext']();

    const boostOptionsItemList = boostOptions.map(
        ({ id, IconComponent, iconCircleClass, iconClassName, title, type }) => {
            return (
                <BoostVCTypeOptionButton
                    key={id}
                    IconComponent={IconComponent}
                    iconCircleClass={iconCircleClass}
                    iconClassName={iconClassName}
                    title={title}
                    categoryType={type}
                    setSelectedCategoryType={setSelectedCategoryType}
                />
            );
        }
    );

    return (
        <section className="bg-indigo-500">
            {selectedCategoryType ? (
                <>
                    <BoostSubCategoryOptions
                        closeAllModals={() => {
                            handleCloseModal?.();
                            handleCloseUserOptionsModal?.();
                        }}
                        handleCloseModal={handleCloseUserOptionsModal}
                        boostUserType={boostUserType}
                        boostCategoryType={selectedCategoryType}
                        setSelectedCategoryType={setSelectedCategoryType}
                        otherUserProfileId={otherUserProfileId}
                        hideBackButton={hideBackButton}
                        showCloseButton={showCloseButton}
                        history={history}
                    />
                </>
            ) : (
                <>
                    <AppContent fullscreen className="bg-indigo-500" color="indigo-500">
                        <AppHeader className="ion-no-border bg-indigo-500 pt-5">
                            <AppToolbar color="#fffff">
                                <AppRow className="flex flex-col pb-4">
                                    <AppCol className="w-full flex items-center justify-center mt-8">
                                        <h6 className="flex items-center justify-center text-white font-mouse text-3xl tracking-wide">
                                            <button
                                                className="text-grayscale-50 p-0 mr-[10px]"
                                                onClick={() => handleCloseModal()}
                                            >
                                                <CaretLeft className="rtl-mirror h-auto w-3 text-white" />
                                            </button>
                                            {title}
                                        </h6>
                                    </AppCol>
                                </AppRow>
                                <AppRow className="flex items-center justify-center w-full">
                                    <AppCol className="text-center">
                                        <p className="text-center text-sm font-semibold px-[16px] text-white">
                                            {subtext}
                                        </p>
                                    </AppCol>
                                </AppRow>
                                <AppRow className="flex items-center justify-center w-full mt-4">
                                    <AppCol className="text-center">
                                        <div className="relative flex flex-col items-center justify-center p-4 pb-0 rounded-3xl flex-1">
                                            <div className="absolute top-0 left-[%50] w-[170px] h-[170px] bg-indigo-800 rounded-full" />
                                            <img
                                                src={MiniGhost}
                                                alt=""
                                                className="z-50 w-[240px] h-[214px] mt-[-35px]"
                                            />
                                        </div>
                                    </AppCol>
                                </AppRow>
                            </AppToolbar>
                        </AppHeader>
                        <AppGrid>
                            <AppRow className="w-full flex items-center justify-center pb-6">
                                <AppCol className="w-full flex flex-col items-center justify-center">
                                    {boostOptionsItemList}
                                </AppCol>
                                <div className="w-full flex items-center justify-center mt-4">
                                    <button
                                        onClick={() => handleCloseModal()}
                                        className="text-white text-center text-sm"
                                    >
                                        {m['common.cancel']()}
                                    </button>
                                </div>
                            </AppRow>
                        </AppGrid>
                    </AppContent>
                </>
            )}
        </section>
    );
};

export default BoostVCTypeOptions;
