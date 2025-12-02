import React from 'react';
import IssueVCCreator from '../IssueVC/IssueVCCreator';
import {
    IonHeader,
    IonButton,
    IonToolbar,
    IonButtons,
    IonCol,
    IonModal,
} from '@ionic/react';
import LeftArrow from 'learn-card-base/svgs/LeftArrow';

export const IssueVCModal = ({
    onDismiss,
    achievementCategory,
    credentialTitle,
}: {
    credentialTitle?: string;
    achievementCategory: any;
    onDismiss: (data?: string | null | undefined | number, role?: string) => void;
}) => {
    const handleDismiss = async () => {
        onDismiss?.();
    };

    return (
        <section className="modal-wrapper overflow-hidden flex flex-col safe--area">
            <IonHeader className="ion-no-border transparent">
                <IonToolbar className="qr-code-user-card-toolbar ion-no-border transparent">
                    <IonButtons slot="start">
                        <IonButton
                            type="button"
                            className="text-grayscale-600 appearance-none"
                            onClick={() => handleDismiss()}
                        >
                            <LeftArrow className="w-10 h-auto text-grayscale-600" />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <section className="h-full w-full bg-grayscale-50 overflow-hidden">
                <div className="w-full h-full relative overflow-auto ">
                    <IssueVCCreator category={achievementCategory} closeModal={onDismiss} />
                </div>
            </section>
        </section>
    );
};

export default IssueVCModal;
