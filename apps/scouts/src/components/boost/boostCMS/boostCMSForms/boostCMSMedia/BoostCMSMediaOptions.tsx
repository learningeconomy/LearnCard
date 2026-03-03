import React from 'react';

import { IonCol, IonContent, IonRow, IonGrid, IonToolbar, IonHeader, IonPage } from '@ionic/react';
import X from 'learn-card-base/svgs/X';
import { BoostCMSState } from '../../../boost';
import CreateMediaAttachmentForm from './CreateMediaAttachmentForm';


const BoostCMSMediaOptions: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    handleCloseModal: () => void;
    showCloseButton?: boolean;
    title?: String | React.ReactNode;
}> = ({ state, setState, handleCloseModal, showCloseButton = true, title }) => {
    

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
                <IonGrid className="ion-padding">
                    <CreateMediaAttachmentForm
                        initialState={state}
                        createMode
                        // handleSave={handleSaveMediaState}
                        setParentState={setState}
                        handleCloseModal={handleCloseModal}
                    />
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default BoostCMSMediaOptions;
