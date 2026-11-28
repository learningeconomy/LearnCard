import React from 'react';

import { useAppOverlayModal } from 'learn-card-base/ui/overlays/useAppOverlayModal';
import { AppCol, AppRow } from 'learn-card-base/ui/layout';
import { AppItem, AppList } from 'learn-card-base/ui/list';
import X from 'learn-card-base/svgs/X';
import DeleteUserConfirmationPrompt from './DeleteUserConfirmationPrompt';
import * as m from '../../paraglide/messages.js';
import { AppContent, AppFooter, AppHeader, AppPage, AppToolbar } from 'learn-card-base/ui/chrome';

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
    const [presentCenterModal, dismissCenterModal] = useAppOverlayModal(
        DeleteUserConfirmationPrompt,
        {
            handleCloseModal: () => dismissCenterModal(),
            showCloseButton: true,
            showFixedFooter: false,
            handleLogout: () => onLogout(),
        }
    );

    const [presentSheetModal, dismissSheetModal] = useAppOverlayModal(
        DeleteUserConfirmationPrompt,
        {
            handleCloseModal: () => dismissSheetModal(),
            showCloseButton: false,
            showFixedFooter: true,
            handleLogout: () => onLogout(),
        }
    );

    const userOptions = [
        {
            id: 1,
            title: m['profile.deleteAccount'](),
            onClick: () => {},
        },
    ];

    const onLogout = () => {
        handleCloseModal();
        handleLogout();
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
                                onClick={() =>
                                    presentCenterModal({
                                        cssClass:
                                            'center-modal user-options-modal delete-user-modal',
                                        backdropDismiss: false,
                                        showBackdrop: false,
                                    })
                                }
                                className="w-full flex items-center justify-center px-[15px] my-[10px] font-medium text-lg modal-btn-desktop"
                            >
                                {link.title}
                            </button>
                            {/* mobile */}
                            <button
                                onClick={() => {
                                    presentSheetModal({
                                        cssClass: 'mobile-modal user-options-modal',
                                        // initialBreakpoint: 1,
                                        // breakpoints: [0, 0, 0, 0],
                                        handleBehavior: 'cycle',
                                    });
                                }}
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
