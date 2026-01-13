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
} from '@ionic/react';
import X from 'learn-card-base/svgs/X';
import DeleteUserConfirmationPrompt from './DeleteUserConfirmationPrompt';
import { useModal, ModalTypes } from 'learn-card-base';

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
            title: 'Delete Account',
            onClick: () => {},
        },
    ];

    const onLogout = () => {
        handleCloseModal();
        handleLogout();
    }

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
