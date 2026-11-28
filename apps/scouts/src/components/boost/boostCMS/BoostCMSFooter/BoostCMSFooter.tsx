import React, { useRef } from 'react';
import { Capacitor } from '@capacitor/core';

import { BoostUserTypeEnum } from '../../boost-options/boostOptions';

import { BoostCategoryOptionsEnum } from 'learn-card-base';
import { boostCategoryOptions } from '../../boost-options/boostOptions';

import keyboardStore from 'learn-card-base/stores/keyboardStore';
import { BoostCMSStepsEnum } from '../../boost';
import * as m from '../../../../paraglide/messages.js';
import { AppFooter, AppToolbar } from 'learn-card-base/ui/chrome';
import { AppSpinner } from 'learn-card-base/ui/feedback/AppSpinner';
import { AppCol, AppRow } from 'learn-card-base/ui/layout';

const BoostCMSFooter: React.FC<{
    boostUserType: BoostUserTypeEnum;
    selectedVCType: BoostCategoryOptionsEnum | string;
    currentStep: BoostCMSStepsEnum;
    handleNextStep: () => void;
    handlePreview: () => void;
    handleSaveAndQuit: () => void;
    isLoading: boolean;
    isSaveLoading: boolean;
    handleSubmit: () => void;
}> = ({
    boostUserType,
    selectedVCType,
    currentStep,
    handleNextStep,
    handlePreview,
    handleSaveAndQuit,
    isLoading,
    isSaveLoading,
    handleSubmit,
}) => {
    const bottomBarRef = useRef<HTMLDivElement>(null);
    const { color, IconComponent } =
        boostCategoryOptions[selectedVCType as BoostCategoryOptionsEnum];

    keyboardStore.store.subscribe(({ isOpen }) => {
        if (isOpen && Capacitor.isNativePlatform() && bottomBarRef.current) {
            bottomBarRef.current.className = `hidden`;
        }
        if (!isOpen && Capacitor.isNativePlatform() && bottomBarRef.current) {
            bottomBarRef.current.className = `flex`;
        }
    });

    return (
        <AppFooter ref={bottomBarRef}>
            <AppToolbar color={color} className="ion-no-border pt-5">
                <AppRow className="w-full flex items-center justify-center">
                    <div className="w-full max-w-[600px] flex items-center justify-center">
                        <AppCol size="12" className="w-full flex items-center">
                            <button
                                onClick={handleSaveAndQuit}
                                className="flex items-center justify-center bg-white rounded-full px-[18px] py-[8px] text-grayscale-900 font-mouse text-3xl shadow-lg uppercase tracking-wide mr-3 text-center boost-save-quit-btn"
                            >
                                {isSaveLoading ? (
                                    <>
                                        <AppSpinner
                                            name="crescent"
                                            color="dark"
                                            className="scale-[1] mr-1"
                                        />{' '}
                                        <p className="w-full line-clamp-1 font-mouse uppercase tracking-wide">
                                            {m['common.saving']()}
                                        </p>
                                    </>
                                ) : (
                                    <p className="w-full line-clamp-1 font-mouse uppercase tracking-wide">
                                        {m['boostCMS.saveQuit']()}
                                    </p>
                                )}
                            </button>
                            <button
                                onClick={handlePreview}
                                className="flex items-center justify-center bg-white rounded-full px-[18px] py-[8px] text-grayscale-900 font-mouse text-3xl shadow-lg uppercase tracking-wide mr-3 text-center overflow-hidden line-clamp-1 boost-preview-btn"
                            >
                                <p className="w-full line-clamp-1 font-mouse uppercase tracking-wide">
                                    {m['common.preview']()}
                                </p>
                            </button>
                            <button
                                onClick={() => {
                                    if (
                                        currentStep === BoostCMSStepsEnum.create &&
                                        boostUserType === BoostUserTypeEnum.self
                                    ) {
                                        handleSubmit();
                                    } else if (
                                        currentStep === BoostCMSStepsEnum.create &&
                                        boostUserType === BoostUserTypeEnum.someone
                                    ) {
                                        handleNextStep();
                                    } else if (
                                        currentStep === BoostCMSStepsEnum.issueTo &&
                                        boostUserType === BoostUserTypeEnum.someone
                                    ) {
                                        handleSubmit();
                                    }
                                }}
                                className="relative flex items-center justify-center bg-white rounded-full px-[18px] py-[8px] text-grayscale-900 font-mouse text-2xl shadow-lg text-center text-ellipsis boost-issue-btn"
                            >
                                <div
                                    className={`flex z-50 items-center justify-center absolute h-[45px] w-[45px] left-1 rounded-full bg-${color}`}
                                >
                                    <IconComponent className={`h-[30px] text-white`} />
                                </div>
                                {isLoading ? (
                                    <>
                                        <AppSpinner
                                            name="crescent"
                                            color="dark"
                                            className="scale-[1] mr-1"
                                        />{' '}
                                        <p className="w-full line-clamp-1 font-mouse uppercase tracking-wide">
                                            {m['common.loading']()}
                                        </p>
                                    </>
                                ) : (
                                    <p className="w-full line-clamp-1 font-mouse uppercase tracking-wide">
                                        {m['boostCMS.issue']()}
                                    </p>
                                )}
                            </button>
                        </AppCol>
                    </div>
                </AppRow>
            </AppToolbar>
        </AppFooter>
    );
};

export default BoostCMSFooter;
