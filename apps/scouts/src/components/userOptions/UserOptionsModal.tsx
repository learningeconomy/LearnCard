import React from 'react';

import {
    IonCol,
    IonContent,
    IonRow,
    IonList,
    IonToolbar,
    IonFooter,
    IonItem,
    IonHeader,
    IonPage,
    useIonModal,
} from '@ionic/react';
import X from 'learn-card-base/svgs/X';
import DeleteUserConfirmationPrompt from './DeleteUserConfirmationPrompt';

const UserOptions: React.FC<{
    handleCloseModal: () => void;
    handleLogout: () => void;
    showFixedFooter?: boolean;
    showCloseButton?: boolean;
    title?: String | React.ReactNode;
    footer?: React.ReactNode;
}> = ({
    handleCloseModal,
    handleLogout,
    showCloseButton = true,
    title,
    showFixedFooter = false,
    footer,
}) => {
    const [presentCenterModal, dismissCenterModal] = useIonModal(DeleteUserConfirmationPrompt, {
        handleCloseModal: () => dismissCenterModal(),
        showCloseButton: true,
        showFixedFooter: false,
        handleLogout: () => onLogout(),
    });

    const [presentSheetModal, dismissSheetModal] = useIonModal(DeleteUserConfirmationPrompt, {
        handleCloseModal: () => dismissSheetModal(),
        showCloseButton: false,
        showFixedFooter: true,
        handleLogout: () => onLogout()
    });

    const userOptions = [
        {
            id: 1,
            title: 'Delete Account',
            onClick: () => {},
        },
    ];

    const onLogout = () => {
        handleCloseModal();
        handleLogout();
    }

    const fixedFooterStyles = showFixedFooter ? 'absolute bottom-[25%] left-0 w-full' : '';

    return (
        <IonPage id="user-options-modal">
            <IonHeader className="ion-no-border">
                <IonRow className="w-full bg-white">
                    <IonCol className="w-full flex items-center justify-end">
                        {showCloseButton && (
                            <button onClick={handleCloseModal}>
                                <X className="text-grayscale-600 h-8 w-8" />
                            </button>
                        )}
                    </IonCol>
                </IonRow>
                {title && <IonToolbar>{title}</IonToolbar>}
            </IonHeader>
            <IonContent>
                <IonList lines="none">
                    {userOptions.map(link => (
                        <IonItem className="w-full" key={link.id}>
                            {/* desktop */}
                            <button
                                onClick={() =>
                                    presentCenterModal({
                                        cssClass: 'center-modal user-options-modal delete-user-modal',
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
                        </IonItem>
                    ))}
                </IonList>
            </IonContent>
            {footer && (
                <IonFooter className={fixedFooterStyles}>
                    <IonToolbar>{footer}</IonToolbar>
                </IonFooter>
            )}
        </IonPage>
    );
};

export default UserOptions;
