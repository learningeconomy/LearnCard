import React from 'react';
import { useIonModal } from '@ionic/react';
import SubHeaderActionMenu from './SubHeaderActionMenu';
import ThreeDots from 'learn-card-base/svgs/ThreeDots';
import { LocationState } from './MainSubHeader.types';

import * as m from '../../paraglide/messages.js';

interface SubheaderPlusActionButtonProps {
    iconColor?: string;
    location: LocationState;
    handleSelfIssue: () => void;
    handleShareCreds: () => void;
}

const WalletActionButton: React.FC<SubheaderPlusActionButtonProps> = ({
    handleSelfIssue,
    handleShareCreds,
}) => {
    // Desktop Modal
    const [presentCenterModal, dismissCenterModal] = useIonModal(SubHeaderActionMenu, {
        handleCloseModal: () => dismissCenterModal(),
        handleSelfIssue: () => handleSelfIssue(),
        handleShareCreds: () => handleShareCreds(),
        showCloseButton: true,
        title: <></>,
    });

    // Mobile Modal
    const [presentSheetModal, dismissSheetModal] = useIonModal(SubHeaderActionMenu, {
        handleCloseModal: () => dismissSheetModal(),
        handleSelfIssue: () => handleSelfIssue(),
        handleShareCreds: () => handleShareCreds(),
        showCloseButton: false,
        title: (
            <p className="font-poppins flex items-center justify-center text-xl w-full h-full text-grayscale-900">
                <></>
            </p>
        ),
    });

    return (
        <>
            <button
                type="button"
                aria-label={m['wallet.actions']()}
                onClick={e => {
                    e.preventDefault();
                    presentCenterModal({
                        cssClass: 'center-modal user-options-modal',
                        backdropDismiss: true,
                        showBackdrop: false,
                    });
                }}
                className="modal-btn-desktop round-bottom-shadow-btn flex items-center justify-center h-12 w-12 rounded-full bg-white sub-header-plus-btn-desktop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
                <ThreeDots className="rotate-90 w-[24px] h-[24px]" />
            </button>
            <button
                type="button"
                aria-label={m['wallet.actions']()}
                onClick={e => {
                    e.preventDefault();
                    presentSheetModal({
                        cssClass: 'mobile-modal user-options-modal',
                        initialBreakpoint: 0.6,
                        breakpoints: [0, 0.6, 0.6, 0.6],
                        handleBehavior: 'cycle',
                    });
                }}
                className="modal-btn-mobile round-bottom-shadow-btn flex items-center justify-center h-12 w-12 rounded-full bg-white sub-header-plus-btn-mobile p-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
                <ThreeDots className="rotate-90 w-[24px] h-[24px]" />
            </button>
        </>
    );
};

export default WalletActionButton;
