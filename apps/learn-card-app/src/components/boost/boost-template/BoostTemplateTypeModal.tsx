import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import { IonTextarea } from '@ionic/react';

import { BoostUserTypeEnum } from '../boost-options/boostOptions';
import { constructCustomBoostType, useModal } from 'learn-card-base';
import { BoostCategoryOptionsEnum, boostCategoryOptions } from '../boost-options/boostOptions';

type BoostTemplateTypeModalProps = {
    selectedCategory: BoostCategoryOptionsEnum;
    otherUserProfileId?: string;
};

const BoostTemplateTypeModal: React.FC<BoostTemplateTypeModalProps> = ({
    selectedCategory,
    otherUserProfileId,
}) => {
    const { closeModal, closeAllModals } = useModal();
    const history = useHistory();

    const [boostType, setBoostType] = useState('');

    const customBoostType = constructCustomBoostType(selectedCategory, boostType);
    const baseLink = `/boost?boostUserType=${BoostUserTypeEnum.someone}&boostCategoryType=${selectedCategory}&boostSubCategoryType=${customBoostType}`;
    let cmsLink = baseLink;
    if (otherUserProfileId) {
        cmsLink = `${baseLink}&otherUserProfileId=${otherUserProfileId}`;
    }

    const { titleSingular, IconWithShape, AltIconWithShapeForColorBg, lightColor, color } =
        boostCategoryOptions[selectedCategory];

    const continueDisabled = boostType.length === 0;

    return (
        <div className="flex flex-col gap-[10px] items-center w-fit mx-auto">
            <div className="flex flex-col gap-[20px] items-center bg-white py-[40px] px-[20px] rounded-[15px] text-grayscale-900">
                <div className={`bg-${lightColor} rounded-full h-[120px] w-[120px] p-[17px]`}>
                    {AltIconWithShapeForColorBg ? (
                        <AltIconWithShapeForColorBg className="h-full w-full" />
                    ) : (
                        <IconWithShape className="h-full w-full" />
                    )}
                </div>
                <h2 className="font-poppins text-[22px] leading-[100%] text-grayscale-900">
                    New {titleSingular}
                </h2>

                <div className="relative">
                    <IonTextarea
                        autocapitalize="on"
                        value={boostType}
                        onIonInput={e => setBoostType(e?.detail?.value)}
                        placeholder="Boost type..."
                        className="relative bg-grayscale-100 text-grayscale-900 placeholder:text-grayscale-500 rounded-[15px] px-[15px] py-[5px]"
                        rows={3}
                        maxlength={22}
                    />
                    <p className="absolute right-[12px] bottom-[7px] font-poppins text-[12px] text-grayscale-600 font-[600] z-[1000]">
                        {22 - boostType.length}
                    </p>
                </div>
            </div>
            <div className="flex items-center justify-center gap-[10px] w-full">
                <button
                    className="bg-grayscale-50 py-[10px] px-[20px] rounded-[30px] text-grayscale-800 font-poppins text-[17px] leading-[130%] tracking-[-0.25px] shadow-bottom-4-4 flex-1"
                    onClick={closeModal}
                >
                    Back
                </button>
                <button
                    className={`flex-1 py-[10px] px-[20px] rounded-[30px] font-poppins text-[17px] leading-[130%] tracking-[-0.25px] shadow-bottom-4-4 text-white disabled:bg-grayscale-300 bg-${color}`}
                    onClick={() => {
                        closeAllModals();
                        history.push(cmsLink);
                    }}
                    disabled={continueDisabled}
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default BoostTemplateTypeModal;
