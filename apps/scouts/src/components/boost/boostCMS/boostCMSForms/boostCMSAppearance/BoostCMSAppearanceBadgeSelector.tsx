import React from 'react';

import {
    IonCol,
    IonContent,
    IonRow,
    IonGrid,
    IonToolbar,
    IonHeader,
    IonPage,
} from '@ionic/react';
import X from 'learn-card-base/svgs/X';
import { BoostCMSState } from '../../../boost';

import BoostCMSAppearanceBadgeList from './BoostCMSAppearanceBadgeList';

const BoostCMSAppearanceBadgeSelector: React.FC<{
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
            <IonContent color="grayscale-100">
                <IonGrid className="ion-padding">
                    <BoostCMSAppearanceBadgeList
                        state={state}
                        setState={setState}
                        handleCloseModal={handleCloseModal}
                    />
                </IonGrid>
                <div className="w-full flex items-center justify-center pb-8">
                    <button
                        onClick={() => handleCloseModal()}
                        className="text-grayscale-900 text-center text-sm"
                    >
                        Cancel
                    </button>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default BoostCMSAppearanceBadgeSelector;
