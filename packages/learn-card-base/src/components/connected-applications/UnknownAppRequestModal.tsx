import React, { useState } from 'react';
import { useWallet } from 'learn-card-base';

import { IonHeader, IonRow, IonCol, IonGrid, IonPage, IonToolbar, useIonToast } from '@ionic/react';

import TRex from '../../assets/images/emptystate-dinocandle.png';

type UnknownAppRequestModalProps = {
    appProfileId: string;
    challenge: string;
    handleCloseModal?: () => void;
    onSuccess?: () => void;
};

export const UnknownAppRequestModal: React.FC<UnknownAppRequestModalProps> = ({
    appProfileId,
    challenge,
    handleCloseModal,
    onSuccess,
}) => {
    const { initWallet } = useWallet();
    const [presentToast] = useIonToast();

    const [loading, setLoading] = useState<boolean>(false);

    const handleApproveConnection = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.stopPropagation();
        const wallet = await initWallet();
        setLoading(true);

        const justTesting = false; // TODO
        if (justTesting) {
            setLoading(false);
            onSuccess?.();
            return;
        }

        try {
            await wallet?.invoke?.connectWithInvite(appProfileId, challenge);
            setLoading(false);
            onSuccess?.();
        } catch (err) {
            presentToast({
                // @ts-ignore
                message: err?.message ?? 'An error ocurred, failed to connect to Application.',
                duration: 5000,
                buttons: [
                    {
                        text: 'Dismiss',
                        role: 'cancel',
                    },
                ],
                position: 'top',
                cssClass: 'login-link-warning-toast',
            });
            // @ts-ignore
            console.log('connectionReq::error', err?.message);
            setLoading(false);
        }
    };

    return (
        <IonPage className="bg-rose-600 text-white pt-[30px] pb-[20px]">
            <IonHeader className="ion-no-border">
                <IonToolbar color="#fffff">
                    <IonRow className="flex flex-col pb-4">
                        <IonCol className="w-full flex items-center justify-center">
                            <h6 className="tracking-[12px] font-bold">LEARNCARD</h6>
                        </IonCol>
                    </IonRow>
                </IonToolbar>
            </IonHeader>
            <IonGrid>
                <IonRow className="flex items-center justify-center w-full">
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-[140px] h-[140px]">
                            <img
                                className="w-full h-full object-cover"
                                src={TRex}
                                alt="Candle T-Rex"
                            />
                            <br />
                        </div>
                        <div className="mt-4 mb-4">
                            <h1 className="font-mouse text-4xl">Unknown App Request</h1>
                        </div>
                    </div>
                </IonRow>
                <IonRow className="flex items-center justify-center w-full">
                    <IonCol className="text-center font-poppins px-[16px]">
                        <p className="text-[16px] font-[500] leading-[24px]">
                            An unknown application wants to connect with you.
                        </p>
                        <br />

                        <p className="text-[14px] leading-[21px]">
                            <span className="font-[700]">Requesting access to:</span>
                            <br />
                            <span className="font-[400]">
                                View your profile photo and name, view and access credentials you
                                select to share, and send credentials to you.
                            </span>
                        </p>

                        <br />
                        {/* <button
                                className="text-indigo-500 font-bold"
                            >
                                Edit Access
                            </button> */}
                    </IonCol>
                </IonRow>
                <IonRow className="w-full flex items-center justify-center mt-6">
                    <IonCol className="flex items-center flex-col max-w-[90%] border-b-[1px] border-grayscale-200">
                        <button
                            type="submit"
                            onClick={handleCloseModal}
                            className="flex items-center justify-center text-rose-600 rounded-full px-[18px] py-[12px] bg-white font-mouse text-3xl w-full shadow-bottom uppercase max-w-[320px]"
                        >
                            Don't Accept
                        </button>

                        <div className="w-full flex items-center justify-center m-4">
                            <button
                                onClick={handleApproveConnection}
                                className="text-center font-[600] text-[17px] leading-[26px] font-poppins w-full font-medium"
                            >
                                {!loading && 'Continue Anyway'}
                                {loading && 'Connecting...'}
                            </button>
                        </div>
                    </IonCol>
                </IonRow>
                <IonRow className="flex items-center justify-center mt-4">
                    <IonCol className="flex flex-col items-center justify-center text-center">
                        <p className="text-center text-sm font-normal px-16">
                            You own your own data.
                            <br />
                            All connections are encrypted.
                        </p>
                        <button className="font-bold">Learn More</button>
                    </IonCol>
                </IonRow>
                <IonRow className="flex items-center justify-center">
                    <IonCol className="flex items-center justify-center">
                        <button className="font-bold text-sm">Privacy Policy</button>
                        <span className="font-bold text-sm">&nbsp;•&nbsp;</span>
                        <button className="font-bold text-sm">Terms of Service</button>
                    </IonCol>
                </IonRow>
            </IonGrid>
        </IonPage>
    );
};

export default UnknownAppRequestModal;
