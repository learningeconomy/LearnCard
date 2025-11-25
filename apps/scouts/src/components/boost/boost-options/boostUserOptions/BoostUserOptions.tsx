import React from 'react';

import {
    IonCol,
    IonContent,
    IonRow,
    IonGrid,
    IonToolbar,
    IonHeader,
    IonPage,
    useIonModal,
} from '@ionic/react';
import X from 'learn-card-base/svgs/X';
import RibbonAwardIcon from 'learn-card-base/svgs/RibbonAwardIcon';
import BoostVCTypeOptions from '../boostVCTypeOptions/BoostVCTypeOptions';

import { BoostUserTypeEnum } from '../boostOptions';

import { useScreenWidth } from 'learn-card-base';

const BoostUserOptions: React.FC<{
    handleCloseModal: () => void;
    showCloseButton?: boolean;
    title?: String | React.ReactNode;
    history: any;
    otherUserProfileId?: string;
}> = ({ handleCloseModal, showCloseButton = true, title, history, otherUserProfileId }) => {
    const width = useScreenWidth(true);

    const [presentBoostSomeoneModal, dismissBoostSomeoneModal] = useIonModal(BoostVCTypeOptions, {
        boostUserType: BoostUserTypeEnum.someone,
        handleCloseModal: () => dismissBoostSomeoneModal(),
        handleCloseUserOptionsModal: () => handleCloseModal(),
        history: history,
        otherUserProfileId: otherUserProfileId,
    });

    const [presentBoostSelfModal, dismissBoostSelfModal] = useIonModal(BoostVCTypeOptions, {
        boostUserType: BoostUserTypeEnum.self,
        handleCloseModal: () => dismissBoostSelfModal(),
        handleCloseUserOptionsModal: () => handleCloseModal(),
        history: history,
    });

    const handleBoostSelfModal = () => {
        if (width <= 991) {
            presentBoostSelfModal({
                cssClass: 'mobile-modal user-options-modal',
                initialBreakpoint: 0.95,
                breakpoints: [0, 0.95, 0.95, 1],
                handleBehavior: 'cycle',
            });
        } else {
            presentBoostSelfModal({
                cssClass: 'center-modal user-qrcode-modal',
                backdropDismiss: true,
                showBackdrop: false,
            });
        }
    };

    const handleBoostSomeoneModal = () => {
        if (width <= 991) {
            presentBoostSomeoneModal({
                cssClass: 'mobile-modal user-options-modal',
                initialBreakpoint: 0.95,
                breakpoints: [0, 0.95, 0.95, 1],
                handleBehavior: 'cycle',
            });
        } else {
            presentBoostSomeoneModal({
                cssClass: 'center-modal user-qrcode-modal',
                backdropDismiss: true,
                showBackdrop: false,
            });
        }
    };

    return (
        <IonPage>
            <IonHeader className="ion-no-border bg-white pt-5">
                <IonRow className="w-full bg-white">
                    <IonCol className="w-full flex items-center justify-end">
                        {showCloseButton && (
                            <button className="mr-[20px]" onClick={handleCloseModal}>
                                <X className="text-grayscale-600 h-8 w-8" />
                            </button>
                        )}
                    </IonCol>
                </IonRow>
                {title && <IonToolbar color="#fffff">{title}</IonToolbar>}
            </IonHeader>
            <IonContent>
                <IonGrid className="ion-padding">
                    <IonCol className="w-full flex items-center justify-center mt-8">
                        <button
                            onClick={handleBoostSelfModal}
                            className="flex items-center justify-center bg-indigo-500 rounded-full px-[18px] py-[12px] text-white font-mouse text-3xl w-full shadow-lg  uppercase tracking-wide"
                        >
                            <RibbonAwardIcon className="ml-[5px] h-[30px] w-[30px] mr-2" /> Yourself
                        </button>
                    </IonCol>
                    <IonCol className="w-full flex items-center justify-center mt-1">
                        <button
                            onClick={handleBoostSomeoneModal}
                            className="flex items-center justify-center bg-indigo-500 rounded-full px-[18px] py-[12px] text-white font-mouse text-3xl w-full shadow-lg uppercase tracking-wide"
                        >
                            <RibbonAwardIcon className="ml-[5px] h-[30px] w-[30px] mr-2" /> Someone
                            Else
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

export default BoostUserOptions;
