import React from 'react';
import { ModalTypes, useModal, useDeviceTypeByWidth } from 'learn-card-base';

import useBoostModal from '../hooks/useBoostModal';

import CredentialGeneralPlus from '../../svgs/CredentialGeneralPlus';
import BoostTemplateTypeModal from './BoostTemplateTypeModal';
import BoostWizard from '../boost-options/boostVCTypeOptions/BoostWizard';
import BoostWizardIcon from 'learn-card-base/svgs/BoostWizardIcon';
import X from 'learn-card-base/svgs/X';
import {
    BoostCategoryOptionsEnum,
    boostCategoryOptions,
    BoostUserTypeEnum,
} from '../boost-options/boostOptions';

type BoostTemplateSelectorFooterProps = {
    selectedCategory: BoostCategoryOptionsEnum;
    otherUserProfileId?: string;
};

const BoostTemplateSelectorFooter: React.FC<BoostTemplateSelectorFooterProps> = ({
    selectedCategory,
    otherUserProfileId,
}) => {
    const { closeModal, newModal } = useModal();
    const { isMobile } = useDeviceTypeByWidth();
    const { color } = boostCategoryOptions[selectedCategory];
    const isAll = selectedCategory === BoostCategoryOptionsEnum.all;
    const boostUserType = BoostUserTypeEnum.someone;

    const { handlePresentBoostModal } = useBoostModal(
        undefined,
        isAll ? undefined : selectedCategory,
        true,
        true,
        otherUserProfileId,
        false,
        isAll ? true : false,
        true
    );

    const baseLink = `/boost?boostUserType=${BoostUserTypeEnum.someone}&boostCategoryType=${selectedCategory}`;
    let link = baseLink;
    if (otherUserProfileId) {
        link = `${baseLink}&otherUserProfileId=${otherUserProfileId}`;
    }

    const handleNewBoostClick = () => {
        if (isAll) {
            handlePresentBoostModal();
        } else {
            newModal(
                <BoostTemplateTypeModal
                    selectedCategory={selectedCategory}
                    otherUserProfileId={otherUserProfileId}
                />,
                {
                    sectionClassName:
                        '!max-w-[500px] !bg-transparent !shadow-none !overflow-visible',
                },
                { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
            );
            // closeAllModals();
            // history.push(link);
        }
    };

    return (
        <footer className="absolute bottom-0 p-[18px] bg-white bg-opacity-70 backdrop-blur-[5px] border-t-[1px] border-solid border-white w-full z-20">
            <button
                onClick={() => {
                    newModal(
                        <BoostWizard boostUserType={boostUserType} />,
                        {
                            sectionClassName: '!max-w-[500px] !bg-white',
                        },
                        {
                            desktop: ModalTypes.Center,
                            mobile: ModalTypes.FullScreen,
                        }
                    );
                }}
                className="bg-cyan-101 text-grayscale-900 text-[17px] px-[20px] py-[5px] rounded-[40px] font-poppins font-[600] w-full flex gap-[5px] justify-center items-center shadow-button-bottom border-[2px] border-solid border-white mb-[10px]"
            >
                AI Boost Wizard
                <BoostWizardIcon className="h-[35px] w-[35px]" />
            </button>
            <div className="max-w-[600px] flex items-center justify-between mx-auto w-full gap-[10px]">
                {isMobile ? (
                    <button
                        onClick={closeModal}
                        className="min-w-[46px] min-h-[46px] bg-white rounded-full flex items-center justify-center shadow-button-bottom"
                    >
                        <X className="w-[20px] h-auto text-grayscale-900" />
                    </button>
                ) : (
                    <button
                        onClick={closeModal}
                        className="bg-white flex-1 p-[7px] text-grayscale-900 font-poppins text-[17px] rounded-[30px] border-[1px] border-solid border-grayscale-200 shadow-button-bottom h-[44px]"
                    >
                        Cancel
                    </button>
                )}
                <button
                    onClick={handleNewBoostClick}
                    className={`bg-${color} flex-1 p-[7px] text-white font-poppins font-[600] text-[17px] rounded-[30px] shadow-button-bottom leading-[24px] tracking-[0.25px] h-full flex items-center justify-center gap-[10px] ${
                        isAll ? 'border-solid border-[2px] border-white !h-[44px]' : ''
                    }`}
                >
                    New Template
                    <CredentialGeneralPlus className={`h-[30px] w-[30px]`} />
                </button>
            </div>
        </footer>
    );
};

export default BoostTemplateSelectorFooter;
