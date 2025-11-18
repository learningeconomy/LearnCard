import React, { useState } from 'react';
import { TrustedAppRegistryEntry, useWallet } from 'learn-card-base';
import { IonHeader, IonRow, IonCol, IonGrid, IonPage, IonToolbar, useIonToast } from '@ionic/react';

type TrustedAppRequestModalProps = {
    appInfo: TrustedAppRegistryEntry;
    challenge: string;
    handleCloseModal?: () => void;
    onSuccess?: () => void;
};

export const TrustedAppRequestModal: React.FC<TrustedAppRequestModalProps> = ({
    appInfo,
    challenge,
    handleCloseModal,
    onSuccess,
}) => {
    const { initWallet } = useWallet();
    const [presentToast] = useIonToast();

    const [loading, setLoading] = useState<boolean>(false);

    const appProfileId = appInfo?.profileId?.toLowerCase();

    const handleApproveConnection = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.stopPropagation();
        const wallet = await initWallet();
        setLoading(true);

        try {
            await wallet?.invoke?.connectWithInvite(appProfileId, challenge);
            setLoading(false);
            onSuccess?.();
        } catch (err) {
            presentToast({
                // @ts-ignore
                message:
                    err?.message ?? `An error ocurred, failed to connect to ${appInfo.app.name}.`,
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
        <IonPage className="bg-white py-[30px]">
            <IonHeader className="ion-no-border">
                <IonToolbar color="#fffff">
                    <IonRow className="flex flex-col pb-4">
                        <IonCol className="w-full flex items-center justify-center">
                            <h6 className="tracking-[12px] text-base font-bold text-black">
                                LEARNCARD
                            </h6>
                        </IonCol>
                    </IonRow>
                </IonToolbar>
            </IonHeader>
            <IonGrid>
                <IonRow className="flex items-center justify-center w-full">
                    <div className="flex flex-col items-center justify-center">
                        <div className="rounded-lg shadow-3xl overflow-hidden w-[60px] h-[60px] mr-3 min-w-[60px] min-h-[60px]">
                            <img
                                className="w-full h-full object-cover"
                                src={appInfo.app.icon}
                                alt={appInfo.app.name}
                            />
                            <br />
                        </div>
                        <div className="mt-4 mb-4">
                            <h1 className="text-grayscale-900 font-mouse text-4xl">
                                {appInfo.app.name}
                            </h1>
                        </div>
                    </div>
                </IonRow>
                <IonRow className="flex items-center justify-center w-full">
                    <IonCol className="text-center">
                        <p className="text-center text-sm font-semibold px-[16px] text-grayscale-800">
                            An application is requesting access to credentials stored in your
                            LearnCard.
                        </p>
                        <br />

                        <p className="text-center text-sm font-semibold px-[16px] text-grayscale-600">
                            <span className="font-semibold text-grayscale-800">
                                Requesting access to:
                            </span>
                            <br />
                            View your profile photo and name, view and access credentials you select
                            to share, and send credentials to you.
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
                            onClick={handleApproveConnection}
                            className="flex items-center justify-center text-white rounded-full px-[18px] py-[12px] bg-emerald-700 font-mouse text-3xl w-full shadow-lg uppercase max-w-[320px]"
                        >
                            {!loading && 'Accept'}
                            {loading && 'Connecting...'}
                        </button>

                        <div className="w-full flex items-center justify-center m-4">
                            <button
                                onClick={() => {
                                    handleCloseModal?.();
                                }}
                                className="text-grayscale-900 text-center text-base w-full font-medium"
                            >
                                Don't Accept
                            </button>
                        </div>
                    </IonCol>
                </IonRow>
                <IonRow className="flex items-center justify-center mt-4">
                    <IonCol className="flex flex-col items-center justify-center text-center">
                        <p className="text-center text-sm font-normal px-16 text-grayscale-600">
                            You own your own data.
                            <br />
                            All connections are encrypted.
                        </p>
                        <button className="text-indigo-500 font-bold">Learn More</button>
                    </IonCol>
                </IonRow>
                <IonRow className="flex items-center justify-center">
                    <IonCol className="flex items-center justify-center">
                        <button className="text-indigo-500 font-bold text-sm">
                            Privacy Policy
                        </button>
                        <span className="text-indigo-500 font-bold text-sm">&nbsp;•&nbsp;</span>
                        <button className="text-indigo-500 font-bold text-sm">
                            Terms of Service
                        </button>
                    </IonCol>
                </IonRow>
            </IonGrid>
        </IonPage>
    );
};

export default TrustedAppRequestModal;
