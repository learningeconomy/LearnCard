import React from 'react';

import { IonCol, IonContent, IonRow, IonGrid, IonToolbar, IonHeader, IonPage } from '@ionic/react';
import X from 'learn-card-base/svgs/X';
import RibbonAwardIcon from 'learn-card-base/svgs/RibbonAwardIcon';
import BoostVCTypeOptions from '../boostVCTypeOptions/BoostVCTypeOptions';

import { BoostUserTypeEnum } from '../boostOptions';

import { useModal } from 'learn-card-base';

import { useTheme } from '../../../../theme/hooks/useTheme';

const BoostUserOptions: React.FC<{
    handleCloseModal: () => void;
    showCloseButton?: boolean;
    title?: String | React.ReactNode;
    history: any;
    otherUserProfileId?: string;
}> = ({ handleCloseModal, showCloseButton = true, title, history, otherUserProfileId }) => {
    const { newModal } = useModal();

    const { colors } = useTheme();
    const primaryColor = colors?.primary;

    const handleBoostSelfModal = () => {
        newModal(<BoostVCTypeOptions boostUserType={BoostUserTypeEnum.self} history={history} />, {
            sectionClassName: '!max-w-[500px]',
        });
    };

    const handleBoostSomeoneModal = () => {
        newModal(
            <BoostVCTypeOptions
                boostUserType={BoostUserTypeEnum.someone}
                history={history}
                otherUserProfileId={otherUserProfileId}
            />,
            { sectionClassName: '!max-w-[500px]' }
        );
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
                            className={`flex items-center justify-center bg-${primaryColor}-500 rounded-full px-[18px] py-[12px] text-white font-poppins text-xl w-full shadow-lg`}
                        >
                            <RibbonAwardIcon className="ml-[5px] h-[30px] w-[30px] mr-2" /> Yourself
                        </button>
                    </IonCol>
                    <IonCol className="w-full flex items-center justify-center mt-1">
                        <button
                            onClick={handleBoostSomeoneModal}
                            className={`flex items-center justify-center bg-${primaryColor}-500 rounded-full px-[18px] py-[12px] text-white font-poppins text-xl w-full shadow-lg`}
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
