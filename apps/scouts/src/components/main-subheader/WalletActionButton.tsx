import React, { useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { IonContent, IonRow, IonCol, useIonModal, IonPage } from '@ionic/react';
import SubHeaderActionMenu from './SubHeaderActionMenu';
import Plus from 'learn-card-base/svgs/Plus';
import modalStateStore from 'learn-card-base/stores/modalStateStore';
import ThreeDots from 'learn-card-base/svgs/ThreeDots';
import { LocationState } from './MainSubHeader.types';

interface SubheaderPlusActionButtonProps {
    iconColor?: string;
    location: LocationState;
    handleSelfIssue: () => void;
    handleShareCreds: () => void;
}

const WalletActionButton: React.FC<SubheaderPlusActionButtonProps> = ({
    iconColor = 'text-white',
    location,
    handleSelfIssue,
    handleShareCreds,
}) => {
    // Desktop Modal
    const [presentCenterModal, dismissCenterModal] = useIonModal(SubHeaderActionMenu, {
        handleCloseModal: () => dismissCenterModal(),
        handleSelfIssue: () => handleSelfIssue(),
        handleShareCreds: () => handleShareCreds(),
        showCloseButton: true,
        title: (
          <></>
        ),
    });

    // Mobile Modal
    const [presentSheetModal, dismissSheetModal] = useIonModal(SubHeaderActionMenu, {
        handleCloseModal: () => dismissSheetModal(),
        handleSelfIssue: () => handleSelfIssue(),
        handleShareCreds: () => handleShareCreds(),
        showCloseButton: false,
        title: (
            <p className="font-mouse flex items-center justify-center text-3xl w-full h-full text-grayscale-900">
                <></>
            </p>
        ),
    });

    return (
        <>
            <button
                onClick={e => {
                    e.preventDefault();
                    presentCenterModal({
                        cssClass: 'center-modal user-options-modal',
                        backdropDismiss: true,
                        showBackdrop: false,
                    });
                }}
                className="modal-btn-desktop round-bottom-shadow-btn flex items-center justify-center h-12 w-12 rounded-full bg-white sub-header-plus-btn-desktop"
            >
               <ThreeDots className="rotate-90 w-[24px] h-[24px]" />
            </button>
            <button
                onClick={e => {
                    e.preventDefault();
                    presentSheetModal({
                        cssClass: 'mobile-modal user-options-modal',
                        initialBreakpoint: 0.6,
                        breakpoints: [0, 0.6, 0.6, 0.6],
                        handleBehavior: 'cycle',
                    });
                }}
                className="modal-btn-mobile flex items-center justify-center h-12 w-12 rounded-full bg-white sub-header-plus-btn-mobile"
            >
                <button
                    type="button"
                    className="round-bottom-shadow-btn flex items-center justify-center p-[10px]"
                >
                    <ThreeDots className="rotate-90 w-[24px] h-[24px]" />
                </button>
            </button>
        </>
    );
};

export default WalletActionButton;
