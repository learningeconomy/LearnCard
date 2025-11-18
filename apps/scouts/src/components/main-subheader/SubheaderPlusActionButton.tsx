import React, { useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { IonContent, IonRow, IonCol, useIonModal, IonPage } from '@ionic/react';
import SubHeaderActionMenu from './SubHeaderActionMenu';
import RibbonAwardIcon from 'learn-card-base/svgs/RibbonAwardIcon';
import Plus from 'learn-card-base/svgs/Plus';
import modalStateStore from 'learn-card-base/stores/modalStateStore';
import BoostUserOptions from '../boost/boost-options/boostUserOptions/BoostUserOptions';
import { LocationState, SubheaderTypeEnum } from './MainSubHeader.types';
import AddAward from 'learn-card-base/svgs/AddAward';
import BoostSelectMenu from '../boost/boost-select-menu/BoostSelectMenu';
import useBoostModal from '../boost/hooks/useBoostModal';
import { BoostCategoryOptionsEnum } from '../boost/boost-options/boostOptions';
import { useCheckIfUserInNetwork } from '../network-prompts/hooks/useCheckIfUserInNetwork';

interface SubheaderPlusActionButtonProps {
    iconColor?: string;
    location: LocationState;
    handleSelfIssue: () => void;
    handleShareCreds: () => void;
    subheaderType: SubheaderTypeEnum;
}

const SubheaderPlusActionButton: React.FC<SubheaderPlusActionButtonProps> = ({
    iconColor = 'text-white',
    location,
    handleSelfIssue,
    handleShareCreds,
    subheaderType,
}) => {
    const history = useHistory();
    const checkIfUserInNetwork = useCheckIfUserInNetwork();

    const [presentCenterModal, dismissCenterModal] = useIonModal(BoostSelectMenu, {
        handleCloseModal: () => dismissCenterModal(),
        showCloseButton: true,
        title: (
            <>
                <p className="font-mouse flex items-center justify-center text-3xl w-full h-full text-grayscale-900">
                    Create a new boost
                </p>
                <p>Who do you want to send to?</p>
            </>
        ),
        history: history,
    });

    const [presentSheetModal, dismissSheetModal] = useIonModal(BoostSelectMenu, {
        handleCloseModal: () => dismissSheetModal(),
        showCloseButton: false,
        title: (
            <>
                <p className="font-mouse flex items-center justify-center text-3xl w-full h-full text-grayscale-900">
                    Create a new boost
                </p>
                <p>Who do you want to send to?</p>
            </>
        ),
        history: history,
    });

    const { handlePresentBoostModal } = useBoostModal(
        history,
        BoostCategoryOptionsEnum.socialBadge
    );

    return (
        <>
            <button
                onClick={e => {
                    e.preventDefault();
                    // presentCenterModal({
                    //     cssClass: 'center-modal user-options-modal',
                    //     backdropDismiss: true,
                    //     showBackdrop: false,
                    // });

                    if (!checkIfUserInNetwork()) return;

                    handlePresentBoostModal();
                }}
                className="modal-btn-desktop flex items-center justify-center h-12 w-12 rounded-full bg-white sub-header-plus-btn-desktop"
            >
                <AddAward className="h-[30px] w-[30px] text-grayscale-900" />
            </button>
            <button
                onClick={e => {
                    e.preventDefault();
                    // presentSheetModal({
                    //     cssClass: 'mobile-modal user-options-modal',
                    //     initialBreakpoint: 0.6,
                    //     breakpoints: [0, 0.6, 1],
                    //     handleBehavior: 'cycle',
                    // });

                    if (!checkIfUserInNetwork()) return;

                    handlePresentBoostModal();
                }}
                className="modal-btn-mobile flex items-center justify-center h-12 w-12 rounded-full bg-white sub-header-plus-btn-mobile"
            >
                <AddAward className="h-[30px] w-[30px] text-grayscale-900" />
            </button>
        </>
    );
};

export default SubheaderPlusActionButton;
