import React from 'react';

import {
    IonCol,
    IonContent,
    IonRow,
    IonGrid,
    IonPage,
} from '@ionic/react';
import * as m from '../../paraglide/messages.js';

const SubHeaderActionMenu: React.FC<{
    handleCloseModal: () => void;
    showCloseButton?: boolean;
    title?: string | React.ReactNode;
    handleSelfIssue: () => void;
    handleShareCreds: () => void;
}> = ({ handleCloseModal, handleSelfIssue, handleShareCreds}) => {

    const handleSelfIssueCredential = () => {
        handleCloseModal?.();
        handleSelfIssue?.();
    }

    const handleCreateCredBundle = () => {
        handleCloseModal?.();
        handleShareCreds?.();
    }

    return (
        <IonPage>
            <IonContent>
                <IonGrid className="ion-padding">
                    <IonCol className="w-full flex items-center justify-center mt-8">
                        <button
                            onClick={handleCreateCredBundle}
                            className="flex items-center justify-center bg-indigo-500 rounded-full px-[18px] py-[12px] text-white font-mouse text-3xl w-full shadow-lg uppercase tracking-wide"
                        >
                           {m['common.share']()}
                        </button>
                    </IonCol>
                    <IonCol className="w-full flex items-center justify-center mt-1">
                        <button
                            onClick={handleSelfIssueCredential}
                            className="flex items-center justify-center bg-indigo-500 rounded-full px-[18px] py-[12px] text-white font-mouse text-3xl w-full shadow-lg uppercase tracking-wide"
                        >
                            {m['sidemenu.viewSharedBoosts']()}
                        </button>
                    </IonCol>
                    <div className="w-full flex items-center justify-center mt-8">
                        <button
                            onClick={() => handleCloseModal()}
                            className="text-grayscale-900 text-center text-sm"
                        >
                            {m['common.cancel']()}
                        </button>
                    </div>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default SubHeaderActionMenu;
