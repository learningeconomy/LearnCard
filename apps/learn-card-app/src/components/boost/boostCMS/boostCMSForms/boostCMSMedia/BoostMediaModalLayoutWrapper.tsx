import React from 'react';
import { IonContent, IonToolbar, IonHeader, IonPage } from '@ionic/react';
import { AppCol, AppGrid, AppRow } from '../../../../layout';
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
                <AppRow className="w-full bg-white">
                    <AppCol className="w-full flex items-center justify-end">
                        {showCloseButton && (
                            <button onClick={handleCloseModal}>
                                <X className="text-grayscale-600 h-8 w-8" />
                            </button>
                        )}
                    </AppCol>
                </AppRow>
                {title && <IonToolbar color="#fffff">{title}</IonToolbar>}
            </IonHeader>
            <IonContent>
                <AppGrid className="ion-padding">{children}</AppGrid>
            </IonContent>
        </IonPage>
    );
};

export default BoostMediaModalLayoutWrapper;
