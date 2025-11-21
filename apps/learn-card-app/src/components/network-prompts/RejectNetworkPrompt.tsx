import React from 'react';

import { IonRow, IonCol, useIonModal } from '@ionic/react';
import { JoinNetworkModalWrapper } from './hooks/useJoinLCNetworkModal';

import { openToS, openPP } from '../../helpers/externalLinkHelpers';
import ModalLayout from '../../layout/ModalLayout';

import useTheme from '../../theme/hooks/useTheme';

export const RejectNetworkPrompt: React.FC<{ handleCloseModal: () => void }> = ({
    handleCloseModal,
}) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const [presentNetworkModal, dismissNetworkModal] = useIonModal(JoinNetworkModalWrapper, {
        handleCloseModal: () => dismissNetworkModal(),
    });

    return (
        <ModalLayout handleOnClick={handleCloseModal}>
            <IonRow className="flex flex-col pb-4 pt-2 w-full">
                <IonCol className="w-full flex items-center justify-center">
                    <h6 className="tracking-[12px] text-base font-bold text-black">LEARNCARD</h6>
                </IonCol>
                <IonCol className="w-full flex items-center justify-center mt-8">
                    <h6 className="text-center text-black font-poppins text-xl">No Problem!</h6>
                </IonCol>
                <IonCol className="w-full flex items-center justify-center mt-8">
                    <h6 className="text-center text-black font-poppins text-xl">
                        You can still use LearnCard.
                    </h6>
                </IonCol>
            </IonRow>
            <IonRow className="flex items-center justify-center w-full">
                <IonCol className="text-center">
                    <p className="text-center text-sm font-semibold px-[16px] text-grayscale-600">
                        You can still receive and share credentials with “school connect” and your{' '}
                        <span className={`text-${primaryColor} font-bold`}>LearnCard number</span>.
                    </p>
                </IonCol>
            </IonRow>
            <IonRow className="w-full flex items-center justify-center mt-6">
                <IonCol className="flex items-center flex-col max-w-[90%] border-b-[1px] border-grayscale-200">
                    <button
                        onClick={() => handleCloseModal()}
                        type="submit"
                        className="flex items-center justify-center text-white rounded-full px-[18px] py-[12px] bg-emerald-700 font-poppins text-xl w-full shadow-lg normal max-w-[320px]"
                    >
                        Continue
                    </button>

                    <div className="w-full flex items-center justify-center m-4">
                        <button
                            onClick={() => {
                                handleCloseModal();
                                presentNetworkModal({
                                    cssClass: 'generic-modal show-modal ion-disable-focus-trap',
                                    backdropDismiss: false,
                                    showBackdrop: false,
                                });
                            }}
                            className="text-grayscale-900 text-center text-base w-full font-medium"
                        >
                            Join LearnCard Network
                        </button>
                    </div>
                </IonCol>
            </IonRow>
            <IonRow className="flex items-center justify-center mt-4 w-full">
                <IonCol className="flex flex-col items-center justify-center text-center">
                    <p className="text-center text-sm font-normal px-16 text-grayscale-600">
                        You own your own data.
                        <br />
                        All connections are encrypted.
                    </p>
                    <button className={`text-${primaryColor} font-bold`}>Learn More</button>
                </IonCol>
            </IonRow>
            <IonRow className="flex items-center justify-center w-full">
                <IonCol className="flex items-center justify-center">
                    <button onClick={openPP} className={`text-${primaryColor} font-bold text-sm`}>
                        Privacy Policy
                    </button>
                    <span className={`text-${primaryColor} font-bold text-sm`}>•</span>
                    <button onClick={openToS} className={`text-${primaryColor} font-bold text-sm`}>
                        Terms of Service
                    </button>
                </IonCol>
            </IonRow>
        </ModalLayout>
    );
};

export default RejectNetworkPrompt;
