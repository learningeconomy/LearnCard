import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

import { IonRow, IonSpinner } from '@ionic/react';
import X from 'learn-card-base/svgs/X';
import BoostCMSAppearanceController from '../boostCMSAppearance/BoostCMSAppearanceController';
import BoostCMSIDAppearanceController from '../boostCMSAppearance/BoostCMSIDAppearanceController';
import FamilyCrest from 'apps/learn-card-app/src/components/familyCMS/FamilyCrest/FamilyCrest';

import { CATEGORY_TO_SUBCATEGORY_LIST } from '../../../boost-options/boostOptions';
import { BoostCategoryOptionsEnum } from 'learn-card-base';
import { BoostCMSState } from '../../../boost';

type BoostShareableQRCodeProps = {
    state: BoostCMSState;
    boostClaimLink: string;
    handleCloseModal?: () => void;
    showCloseButton?: boolean;
    text?: string;
};

const BoostShareableQRCode: React.FC<BoostShareableQRCodeProps> = ({
    state,
    boostClaimLink,
    handleCloseModal,
    showCloseButton = false,
    text = 'Scan Code to Claim Boost',
}) => {
    const defaultTitle =
        CATEGORY_TO_SUBCATEGORY_LIST?.[state?.basicInfo?.type]?.find(
            options => options?.type === state?.basicInfo?.achievementType
        )?.title ?? '';

    const isID = state?.basicInfo?.type === BoostCategoryOptionsEnum.id;
    const isMembership = state?.basicInfo?.type === BoostCategoryOptionsEnum.membership;
    const isFamily = state?.basicInfo?.type === BoostCategoryOptionsEnum.family;

    return (
        <IonRow className="flex flex-col items-center justify-center vc-preview-modal-safe-area">
            <div className="bg-white w-full max-w-[400px] min-w-[320px] rounded-[20px] shadow-3xl pt-3 mt-8 relative">
                {showCloseButton && handleCloseModal && (
                    <button
                        type="button"
                        aria-label="Close"
                        onClick={handleCloseModal}
                        className="absolute top-4 right-4 z-10 text-grayscale-700 hover:text-grayscale-900 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
                {(isID || isMembership) && (
                    <BoostCMSIDAppearanceController
                        state={state}
                        showEditButton={false}
                        customHeaderClass="w-[95%]"
                        showEditAppearanceText={false}
                    />
                )}

                {!isID && !isMembership && !isFamily && (
                    <BoostCMSAppearanceController
                        state={state}
                        showEditButton={false}
                        customHeaderClass="w-[95%]"
                    />
                )}
                {isFamily && (
                    <div className="w-full !mb-10">
                        <FamilyCrest
                            containerClassName="z-9999"
                            imageClassName="w-[90px]"
                            familyName={state?.basicInfo?.name}
                            thumbnail={state?.appearance?.badgeThumbnail}
                            showSleeve={false}
                            showEmoji
                            emoji={state?.appearance?.emoji}
                        />
                    </div>
                )}
                {!isFamily && (
                    <div className="w-full flex items-end justify-center pb-2">
                        <h3 className="font-poppins text-grayscale-800 text-xl text-center mt-2">
                            {state?.basicInfo?.name || defaultTitle}
                        </h3>
                    </div>
                )}

                {boostClaimLink ? (
                    <>
                        <div className="flex justify-center items-center w-full relative px-10 mb-2 mt-2">
                            <div className="max-w-[220px] w-full h-auto relative">
                                <QRCodeSVG
                                    className="h-full w-full"
                                    value={boostClaimLink}
                                    bgColor="transparent"
                                />
                            </div>
                        </div>

                        <div className="w-full flex items-end justify-center pt-4 pb-6">
                            <h3 className="font-poppins text-grayscale-800 text-xl text-center">
                                {text}
                            </h3>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center w-full px-10 py-8 gap-3">
                        <IonSpinner name="crescent" color="dark" />

                        <p className="font-poppins text-grayscale-500 text-sm text-center">
                            Generating claim link...
                        </p>
                    </div>
                )}
            </div>
        </IonRow>
    );
};

export default BoostShareableQRCode;
