import React, { useState } from 'react';

import { IonHeader, IonContent, IonRow, IonCol, IonGrid, IonPage, IonToolbar } from '@ionic/react';

import BoostVCTypeOptionButton from './BoostVCTypeOptionButton';
import BoostSubCategoryOptions from '../boostSubCategoryOptions/BoostSubCategoryOptions';
import MiniGhost from 'learn-card-base/assets/images/ghostboost.png';
import CaretLeft from '../../../svgs/CaretLeft';

import { boostVCTypeOptions, BoostUserTypeEnum } from '../boostOptions';
import { BoostCategoryOptionsEnum } from 'learn-card-base';

type BoostVCTypeOptionsProps = {
    boostUserType: BoostUserTypeEnum;
    handleCloseModal: () => void;
    handleCloseUserOptionsModal: () => void;
    otherUserProfileId?: string;
    boostCategoryType?: BoostCategoryOptionsEnum;
    hideBackButton: boolean;
    showCloseButton: boolean;
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

    const title = boostUserType === BoostUserTypeEnum.self ? 'Yourself!' : 'Someone!';
    const boostOptions = boostVCTypeOptions[boostUserType];

    const subtext =
        boostUserType === BoostUserTypeEnum.self
            ? 'You can issue yourself credentials to tell your story. Your skills are currencies for your future.'
            : ' Issue credentials to people you know, teach and admire. Every boost of encouragement counts.';

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
                    <IonContent fullscreen className="bg-indigo-500" color="indigo-500">
                        <IonHeader className="ion-no-border bg-indigo-500 pt-5">
                            <IonToolbar color="#fffff">
                                <IonRow className="flex flex-col pb-4">
                                    <IonCol className="w-full flex items-center justify-center mt-8">
                                        <h6 className="flex items-center justify-center text-white font-mouse text-3xl tracking-wide">
                                            <button
                                                className="text-grayscale-50 p-0 mr-[10px]"
                                                onClick={() => handleCloseModal()}
                                            >
                                                <CaretLeft className="h-auto w-3 text-white" />
                                            </button>
                                            {title}
                                        </h6>
                                    </IonCol>
                                </IonRow>
                                <IonRow className="flex items-center justify-center w-full">
                                    <IonCol className="text-center">
                                        <p className="text-center text-sm font-semibold px-[16px] text-white">
                                            {subtext}
                                        </p>
                                    </IonCol>
                                </IonRow>
                                <IonRow className="flex items-center justify-center w-full mt-4">
                                    <IonCol className="text-center">
                                        <div className="relative flex flex-col items-center justify-center p-4 pb-0 rounded-3xl flex-1">
                                            <div className="absolute top-0 left-[%50] w-[170px] h-[170px] bg-indigo-800 rounded-full" />
                                            <img
                                                src={MiniGhost}
                                                alt="ghost"
                                                className="z-50 w-[240px] h-[214px] mt-[-35px]"
                                            />
                                        </div>
                                    </IonCol>
                                </IonRow>
                            </IonToolbar>
                        </IonHeader>
                        <IonGrid>
                            <IonRow className="w-full flex items-center justify-center pb-6">
                                <IonCol className="w-full flex flex-col items-center justify-center">
                                    {boostOptionsItemList}
                                </IonCol>
                                <div className="w-full flex items-center justify-center mt-4">
                                    <button
                                        onClick={() => handleCloseModal()}
                                        className="text-white text-center text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </IonRow>
                        </IonGrid>
                    </IonContent>
                </>
            )}
        </section>
    );
};

export default BoostVCTypeOptions;
