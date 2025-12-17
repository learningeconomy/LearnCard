import React from 'react';

import {
    IonCol,
    IonContent,
    IonRow,
    IonGrid,
    IonToolbar,
    IonHeader,
    IonPage,
    IonModal,
    useIonModal,
} from '@ionic/react';
import { ACHIEVEMENT_CATEGORIES } from '../../../../../packages/learn-card-base/src/components/IssueVC/constants';
import X from 'learn-card-base/svgs/X';


const SubHeaderActionMenu: React.FC<{
    handleCloseModal: () => void;
    showCloseButton?: boolean;
    title?: String | React.ReactNode;
    handleSelfIssue: () => void;
    handleShareCreds: () => void;
}> = ({ handleCloseModal, showCloseButton = true, title, handleSelfIssue, handleShareCreds}) => {

  
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
            {/* <IonHeader className="ion-no-border bg-white pt-5">
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
            </IonHeader> */}
            <IonContent>
                <IonGrid className="ion-padding">
                    <IonCol className="w-full flex items-center justify-center mt-8">
                        {/* desktop */}
                        <button
                            onClick={handleCreateCredBundle}
                            className="flex items-center justify-center bg-indigo-500 rounded-full px-[18px] py-[12px] text-white font-mouse text-3xl w-full shadow-lg modal-btn-desktop uppercase tracking-wide"
                        >
                            Share
                        </button>
                        {/* mobile */}
                        <button
                            onClick={handleCreateCredBundle}
                            className="flex items-center justify-center bg-indigo-500 rounded-full px-[18px] py-[12px] text-white font-mouse text-3xl w-full shadow-lg modal-btn-mobile uppercase tracking-wide"
                        >
                           Share
                        </button>
                    </IonCol>
                    <IonCol className="w-full flex items-center justify-center mt-1">
                        {/* desktop */}
                        <button
                            onClick={handleSelfIssueCredential}
                            className="flex items-center justify-center bg-indigo-500 rounded-full px-[18px] py-[12px] text-white font-mouse text-3xl w-full shadow-lg modal-btn-desktop uppercase tracking-wide"
                        >
                            View Shared Boosts
                        </button>
                        {/* mobile */}
                        <button
                            onClick={handleSelfIssueCredential}
                            className="flex items-center justify-center bg-indigo-500 rounded-full px-[18px] py-[12px] text-white font-mouse text-3xl w-full shadow-lg modal-btn-mobile uppercase tracking-wide"
                        >
                            View Shared Boosts
                        </button>
                    </IonCol>
                    <div className="w-full flex items-center justify-center mt-8">
                        <button
                            onClick={() => handleCloseModal()}
                            className="text-grayscale-900 text-center text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default SubHeaderActionMenu;
