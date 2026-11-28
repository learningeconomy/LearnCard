import React from 'react';

import X from 'learn-card-base/svgs/X';
import DeleteUserConfirmationPrompt from './DeleteUserConfirmationPrompt';
import * as m from '../../paraglide/messages.js';
import { useModal, ModalTypes } from 'learn-card-base';
import { AppContent, AppFooter, AppHeader, AppPage, AppToolbar } from 'learn-card-base/ui/chrome';
import { AppCol, AppRow } from 'learn-card-base/ui/layout';
import { AppItem, AppList } from 'learn-card-base/ui/list';

const UserOptions: React.FC<{
    handleCloseModal: () => void;
    handleLogout: () => void;
    showFixedFooter?: boolean;
    showCloseButton?: boolean;
    title?: string | React.ReactNode;
    footer?: React.ReactNode;
}> = ({
    handleCloseModal,
    handleLogout,
    showCloseButton = true,
    title,
    showFixedFooter = false,
    footer,
}) => {
    const { newModal: newCenterModal, closeModal: closeCenterModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

    const { newModal: newSheetModal, closeModal: closeSheetModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const userOptions = [
        {
            id: 1,
            title: m['userProfile.deleteAccount'](),
            onClick: () => {},
        },
    ];

    const onLogout = () => {
        handleCloseModal();
        handleLogout();
    };

    const presentCenterModal = () => {
        newCenterModal(
            <DeleteUserConfirmationPrompt
                handleCloseModal={() => closeCenterModal()}
                handleLogout={() => onLogout()}
            />
        );
    };

    const presentSheetModal = () => {
        newSheetModal(
            <DeleteUserConfirmationPrompt
                handleCloseModal={() => closeSheetModal()}
                handleLogout={() => onLogout()}
            />
        );
    };

    const fixedFooterStyles = showFixedFooter ? 'absolute bottom-[25%] left-0 w-full' : '';

    return (
        <AppPage id="user-options-modal">
            <AppHeader className="ion-no-border">
                <AppRow className="w-full bg-white">
                    <AppCol className="w-full flex items-center justify-end">
                        {showCloseButton && (
                            <button onClick={handleCloseModal}>
                                <X className="text-grayscale-600 h-8 w-8" />
                            </button>
                        )}
                    </AppCol>
                </AppRow>
                {title && <AppToolbar>{title}</AppToolbar>}
            </AppHeader>
            <AppContent>
                <AppList lines="none">
                    {userOptions.map(link => (
                        <AppItem className="w-full" key={link.id}>
                            {/* desktop */}
                            <button
                                onClick={() => presentCenterModal()}
                                className="w-full flex items-center justify-center px-[15px] my-[10px] font-medium text-lg modal-btn-desktop"
                            >
                                {link.title}
                            </button>
                            {/* mobile */}
                            <button
                                onClick={() => presentSheetModal()}
                                className="w-full flex items-center justify-center px-[15px] my-[10px] font-medium text-lg modal-btn-mobile"
                            >
                                {link.title}
                            </button>
                        </AppItem>
                    ))}
                </AppList>
            </AppContent>
            {footer && (
                <AppFooter className={fixedFooterStyles}>
                    <AppToolbar>{footer}</AppToolbar>
                </AppFooter>
            )}
        </AppPage>
    );
};

export default UserOptions;
