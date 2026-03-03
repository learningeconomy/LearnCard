import React from 'react';

import { IonContent, IonPage, IonRow } from '@ionic/react';

import X from 'learn-card-base/svgs/X';
import BoostCMSAppearanceController from '../boostCMSAppearance/BoostCMSAppearanceController';
import BoostCMSIDAppearanceController from '../boostCMSAppearance/BoostCMSIDAppearanceController';

import { BoostCMSState } from '../../../boost';
import { CATEGORY_TO_SUBCATEGORY_LIST } from '../../../boost-options/boostOptions';
import { QRCodeSVG } from 'qrcode.react';
import { BoostCategoryOptionsEnum } from 'learn-card-base';

const BoostShareableQRCode: React.FC<{
    handleCloseModal: () => void;
    state: BoostCMSState;
    boostClaimLink: string;
}> = ({ handleCloseModal, state, boostClaimLink }) => {
    const defaultTitle =
        CATEGORY_TO_SUBCATEGORY_LIST?.[state?.basicInfo?.type].find(
            options => options?.type === state?.basicInfo?.achievementType
        )?.title ?? '';

    const isID = state?.basicInfo?.type === BoostCategoryOptionsEnum.id;
    const isMembership = state?.basicInfo?.type === BoostCategoryOptionsEnum.membership;

    return (
        <IonPage>
            <IonContent
                className="flex items-center justify-center ion-padding boost-cms-preview"
                fullscreen
            >
                <IonRow className="flex flex-col items-center justify-center">
                    {' '}
                    <div className="flex items-center justify-center mb-2 vc-preview-modal-safe-area">
                        <button
                            onClick={handleCloseModal}
                            className="w-[50px] h-[50px] bg-white rounded-full flex items-center justify-center shadow-3xl"
                        >
                            <X className="text-black w-[30px]" />
                        </button>
                    </div>
                    <div className="bg-white w-[40%] max-w-[400px] min-w-[320px] rounded-[20px] shadow-3xl">
                        {isID || isMembership ? (
                            <BoostCMSIDAppearanceController
                                state={state}
                                showEditButton={false}
                                customHeaderClass="w-[95%]"
                                showEditAppearanceText={false}
                            />
                        ) : (
                            <BoostCMSAppearanceController
                                state={state}
                                showEditButton={false}
                                customHeaderClass="w-[95%]"
                            />
                        )}
                        <div className="w-full flex items-end justify-center pb-2">
                            <h3 className="text-grayscale-800 text-2xl font-medium text-center">
                                {state?.basicInfo?.name || defaultTitle}
                            </h3>
                        </div>
                        <div className="flex justify-center items-center w-full relative px-10 mb-5 mt-5">
                            <div className="max-w-[80%] w-full h-auto relative">
                                <QRCodeSVG
                                    className="h-full w-full"
                                    value={boostClaimLink}
                                    bgColor="transparent"
                                />
                            </div>
                        </div>
                        <div className="w-full flex items-end justify-center pt-4 pb-6">
                            <h3 className="text-grayscale-800 text-xl text-center">
                                Scan Code to Claim Boost
                            </h3>
                        </div>
                    </div>
                </IonRow>
            </IonContent>
        </IonPage>
    );
};

export default BoostShareableQRCode;
