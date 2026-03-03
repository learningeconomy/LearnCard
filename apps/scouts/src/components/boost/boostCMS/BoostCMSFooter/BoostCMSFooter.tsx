import React, { useRef } from 'react';
import { Capacitor } from '@capacitor/core';

import { IonToolbar, IonRow, IonCol, IonFooter, IonSpinner } from '@ionic/react';

import { BoostUserTypeEnum } from '../../boost-options/boostOptions';

import { BoostCategoryOptionsEnum } from 'learn-card-base';
import { boostCategoryOptions } from '../../boost-options/boostOptions';

import keyboardStore from 'learn-card-base/stores/keyboardStore';
import { BoostCMSStepsEnum } from '../../boost';

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
    const bottomBarRef = useRef<HTMLDivElement>();
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
        <IonFooter ref={bottomBarRef}>
            <IonToolbar color={color} className="ion-no-border pt-5">
                <IonRow className="w-full flex items-center justify-center">
                    <div className="w-full max-w-[600px] flex items-center justify-center">
                        <IonCol size="12" className="w-full flex items-center">
                            <button
                                onClick={handleSaveAndQuit}
                                className="flex items-center justify-center bg-white rounded-full px-[18px] py-[8px] text-grayscale-900 font-mouse text-3xl shadow-lg uppercase tracking-wide mr-3 text-center boost-save-quit-btn"
                            >
                                {isSaveLoading ? (
                                    <>
                                        <IonSpinner
                                            name="crescent"
                                            color="dark"
                                            className="scale-[1] mr-1"
                                        />{' '}
                                        <p className="w-full line-clamp-1 font-mouse uppercase tracking-wide">
                                            Saving...
                                        </p>
                                    </>
                                ) : (
                                    <p className="w-full line-clamp-1 font-mouse uppercase tracking-wide">
                                        Save & Quit
                                    </p>
                                )}
                            </button>
                            <button
                                onClick={handlePreview}
                                className="flex items-center justify-center bg-white rounded-full px-[18px] py-[8px] text-grayscale-900 font-mouse text-3xl shadow-lg uppercase tracking-wide mr-3 text-center overflow-hidden line-clamp-1 boost-preview-btn"
                            >
                                <p className="w-full line-clamp-1 font-mouse uppercase tracking-wide">
                                    Preview
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
                                        <IonSpinner
                                            name="crescent"
                                            color="dark"
                                            className="scale-[1] mr-1"
                                        />{' '}
                                        <p className="w-full line-clamp-1 font-mouse uppercase tracking-wide">
                                            Loading...
                                        </p>
                                    </>
                                ) : (
                                    <p className="w-full line-clamp-1 font-mouse uppercase tracking-wide">
                                        Issue
                                    </p>
                                )}
                            </button>
                        </IonCol>
                    </div>
                </IonRow>
            </IonToolbar>
        </IonFooter>
    );
};

export default BoostCMSFooter;
