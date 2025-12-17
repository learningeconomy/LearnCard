import React from 'react';
import { IonCol, IonContent, IonRow, IonGrid, IonToolbar, IonHeader, IonPage } from '@ionic/react';
import X from 'learn-card-base/svgs/X';

type BoostMediaModalLayoutWrapperProps = {
    showCloseButton?: boolean;
    handleCloseModal?: () => void;
    title?: string;
    children: React.ReactNode;
};

export const BoostMediaModalLayoutWrapper: React.FC<BoostMediaModalLayoutWrapperProps> = ({
    showCloseButton,
    handleCloseModal,
    title,
    children,
}) => {
    return (
        <IonPage id="user-options-modal">
            <IonHeader className="ion-no-border bg-white pt-5">
                <IonRow className="w-full bg-white">
                    <IonCol className="w-full flex items-center justify-end">
                        {showCloseButton && (
                            <button onClick={handleCloseModal}>
                                <X className="text-grayscale-600 h-8 w-8" />
                            </button>
                        )}
                    </IonCol>
                </IonRow>
                {title && <IonToolbar color="#fffff">{title}</IonToolbar>}
            </IonHeader>
            <IonContent>
                <IonGrid className="ion-padding">{children}</IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default BoostMediaModalLayoutWrapper;
