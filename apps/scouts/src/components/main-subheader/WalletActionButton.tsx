import React from 'react';
import { useModal, ModalTypes } from 'learn-card-base';
import SubHeaderActionMenu from './SubHeaderActionMenu';
import ThreeDots from 'learn-card-base/svgs/ThreeDots';
import { LocationState } from './MainSubHeader.types';

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
    const { newModal: newCenterModal, closeModal: closeCenterModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

    const { newModal: newSheetModal, closeModal: closeSheetModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const presentCenterModal = () => {
        newCenterModal(
            <SubHeaderActionMenu
                handleCloseModal={closeCenterModal}
                handleSelfIssue={() => handleSelfIssue()}
                handleShareCreds={() => handleShareCreds()}
                showCloseButton={true}
                title={<></>}
            />
        );
    };

    const presentSheetModal = () => {
        newSheetModal(
            <SubHeaderActionMenu
                handleCloseModal={closeSheetModal}
                handleSelfIssue={() => handleSelfIssue()}
                handleShareCreds={() => handleShareCreds()}
                showCloseButton={false}
                title={
                    <p className="font-mouse flex items-center justify-center text-3xl w-full h-full text-grayscale-900">
                        <></>
                    </p>
                }
            />
        );
    };

    return (
        <>
            <button
                onClick={e => {
                    e.preventDefault();
                    presentCenterModal();
                }}
                className="modal-btn-desktop round-bottom-shadow-btn flex items-center justify-center h-12 w-12 rounded-full bg-white sub-header-plus-btn-desktop"
            >
               <ThreeDots className="rotate-90 w-[24px] h-[24px]" />
            </button>
            <button
                onClick={e => {
                    e.preventDefault();
                    presentSheetModal();
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
