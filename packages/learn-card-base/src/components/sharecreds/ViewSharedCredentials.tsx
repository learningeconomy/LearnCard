import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';

import { Clipboard } from '@capacitor/clipboard';
import { Browser } from '@capacitor/browser';
import {
    IonContent,
    IonPage,
    IonHeader,
    IonButton,
    IonToolbar,
    IonButtons,
    IonSpinner,
    useIonAlert,
} from '@ionic/react';
import LeftArrow from 'learn-card-base/svgs/LeftArrow';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { getBaseUrl, useGetCredentialsListFromIDX, useToast, ToastTypeEnum } from 'learn-card-base';
export const baseUrl = getBaseUrl();

type IDXBundle = {
    bundleId: string;
    pin: string;
    randomSeed: string;
    uri: string;
};

const ViewSharedCredentials = ({
    onDismiss,
}: {
    onDismiss: (data?: string | null | undefined | number, role?: string) => void;
}) => {
    const [page, setPage] = useState('application');
    const { presentToast } = useToast();
    const [vpUri, setVpUri] = useState<string>();
    const currentUser = useCurrentUser();
    const [presentAlert] = useIonAlert();

    const { data: currentIndex, isLoading: loading } = useGetCredentialsListFromIDX(currentUser);

    const handleCopy = async (bundle: IDXBundle) => {
        const uri = bundle?.uri;
        const randomSeed = bundle?.randomSeed;
        const link = `https://${baseUrl}/share-creds/${uri}/${randomSeed}`;
        try {
            await Clipboard.write({
                string: link,
            });
            presentToast('Verified resume link copied to clipboard', {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (err) {
            presentToast('Unable to copy verified resume link to clipboard', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const handleViewLink = async (bundle: IDXBundle) => {
        const uri = bundle?.uri;
        const randomSeed = bundle?.randomSeed;
        const link = `https://${baseUrl}/share-creds/${uri}/${randomSeed}`;

        if (Capacitor.isNativePlatform()) {
            await Browser?.open({ url: link });
        } else {
            window?.open(link);
        }
    };

    const handleDismiss = () => {
        onDismiss();
    };

    const renderBundleList = currentIndex?.bundles?.map((bundle: IDXBundle) => {
        return (
            <div className="shadow-[0_0_8px_0px_rgba(0,0,0,0.2)] p-[20px] m-[20px] rounded-[20px]">
                <div className="text-left">
                    <br />
                    <strong className="text-[20px]">Your PIN is: {bundle?.pin} </strong>
                    <br />
                    <br />
                    <strong className="text-[14px] mt-[20px] text-left">
                        Share your PIN and this link:{' '}
                        <div className="py-[10px] flex flex-wrap">
                            <button
                                onClick={() => handleCopy(bundle)}
                                className="mt-[5px] bg-cyan-700 py-[15px] px-[25px] rounded-[40px] text-grayscale-50 text-[17px] font-bold"
                            >
                                Copy link
                            </button>
                            <button
                                onClick={() => handleViewLink(bundle)}
                                className="mt-[5px] bg-cyan-700 py-[15px] px-[25px] ml-[10px] rounded-[40px] text-grayscale-50 text-[17px] font-bold"
                            >
                                View Link
                            </button>
                        </div>
                    </strong>
                    <br />
                    <br />
                </div>
            </div>
        );
    });

    return (
        <IonPage className="modal-wrapper">
            <IonHeader className="ion-no-border ion-fixed">
                <IonToolbar className=" ion-no-border ">
                    <IonButtons slot="start">
                        <IonButton className="text-graye-600" onClick={() => handleDismiss()}>
                            <LeftArrow className="w-10 h-auto text-gray-600" />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="course-details-container bg-white h-full" fullscreen>
                {loading && (
                    <div className="flex flex-col justify-center items-center w-full h-full">
                        <div className="flex flex-col justify-center items-center w-full h-full mt-[-100px]">
                            <IonSpinner name="crescent" color="dark" className="scale-[1.75]" />
                            <p className="mt-[30px]">Loading shared boost bundles....</p>
                        </div>
                    </div>
                )}

                {!loading && (
                    <section className="text-center flex flex-col p-[20px] max-w-[600px] m-auto">
                        <p>Boost Bundles</p>
                        {renderBundleList}
                    </section>
                )}
            </IonContent>
        </IonPage>
    );
};

export default ViewSharedCredentials;
