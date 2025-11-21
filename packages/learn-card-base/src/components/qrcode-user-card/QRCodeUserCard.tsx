import React from 'react';

import {
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonContent,
    IonRow,
    IonCol,
} from '@ionic/react';
import { Capacitor } from '@capacitor/core';

import { QRCodeCard } from '@learncard/react';
import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import LeftArrow from 'learn-card-base/svgs/LeftArrow';
import Mail from 'learn-card-base/svgs/Mail';
import Print from 'learn-card-base/assets/images/print.png';
import Share from 'learn-card-base/svgs/Share';
import ProfilePicture from 'learn-card-base/components/profilePicture/ProfilePicture';

import useWeb3Auth from 'learn-card-base/hooks/useWeb3Auth';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import useSQLiteStorage from 'learn-card-base/hooks/useSQLiteStorage';

import authStore from 'learn-card-base/stores/authStore';
import firebaseAuthStore from 'learn-card-base/stores/firebaseAuthStore';

import { SocialLoginTypes } from 'learn-card-base/hooks/useSocialLogins';
import { LOGIN_REDIRECTS } from 'learn-card-base/constants/redirects';
import { BrandingEnum } from '../headerBranding/headerBrandingHelpers';

const QrCodeUserCard: React.FC<{
    handleQRCodeCardModal: () => void;
    branding: BrandingEnum;
}> = ({ handleQRCodeCardModal, branding }) => {
    const { logout } = useWeb3Auth();
    const { clearDB } = useSQLiteStorage();
    const currentUser = useCurrentUser();
    const firebaseAuthentication = firebaseAuthStore.get.firebaseAuth();

    let brandingText: React.ReactNode | null = null;

    if (branding === BrandingEnum.learncard) {
        brandingText = (
            <h6 className="text-base tracking-[6px] font-bold text-black w-full text-center">
                LEARNCARD
            </h6>
        );
    } else if (branding === BrandingEnum.metaversity) {
        brandingText = (
            <h6 className="text-base tracking-[6px] font-bold text-mv_red-700 w-full text-center">
                META
                <span className="text-mv_blue-700">VERSITY</span>
            </h6>
        );
    }

    return (
        <>
            <IonHeader className="ion-no-border">
                <IonToolbar className="qr-code-user-card-toolbar ion-no-border">
                    <IonButtons slot="start">
                        <IonButton className="text-grayscale-600" onClick={handleQRCodeCardModal}>
                            <LeftArrow className="w-10 h-auto text-grayscale-600" />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent
                className="flex items-center justify-center ion-padding qr-code-user-card-content"
                color="grayscale-red-100"
            >
                <IonRow className="flex items-center justify-center">
                    <IonCol size="12" className="flex flex-col items-center justify-center w-full">
                        <ProfilePicture
                            customContainerClass="flex items-center justify-center rounded-full overflow-hidden h-16 w-16 object-contain text-white font-medium text-4xl"
                            customImageClass="w-full h-full"
                            customSize={120}
                        />
                        <p className="text-xl text-center font-medium mt-3 w-full text-indigo-900">
                            {currentUser?.name || currentUser?.email}
                        </p>
                        <div className="flex items-center justify-center w-full">
                            {/* <button className="mr-1 text-indigo-500 font-semibold text-lg text-center">
                                Profile
                            </button>
                            <span> • </span>
                            <button className="mr-1 text-indigo-500 font-semibold text-lg text-center">
                                &nbsp;Settings
                            </button>
                            <span> • </span> */}
                            <button
                                onClick={async () => {
                                    const typeOfLogin = authStore?.get?.typeOfLogin();
                                    const nativeSocialLogins = [
                                        SocialLoginTypes.apple,
                                        SocialLoginTypes.sms,
                                        SocialLoginTypes.passwordless,
                                        SocialLoginTypes.google
                                    ];

                                    const redirectUrl =
                                        IS_PRODUCTION || Capacitor.getPlatform() === 'android'
                                            ? LOGIN_REDIRECTS[branding].redirectUrl
                                            : LOGIN_REDIRECTS[branding].devRedirectUrl;

                                    handleQRCodeCardModal();

                                    if (
                                        nativeSocialLogins.includes(typeOfLogin) &&
                                        Capacitor.isNativePlatform()
                                    ) {
                                        try {
                                            await firebaseAuthentication?.signOut?.();
                                        } catch (e) {
                                            console.log('firebase::signout::error', e);
                                        }
                                    }
                                    logout(redirectUrl);
                                    await clearDB();
                                }}
                                className="mr-1 text-indigo-500 font-semibold text-lg text-center"
                            >
                                &nbsp;Logout
                            </button>
                        </div>
                    </IonCol>
                    <IonCol size="12" className="flex justify-center items-center w-full">
                        <QRCodeCard
                            userHandle={`@${currentUser?.name}`}
                            qrCodeValue="https://www.npmjs.com/package/@learncard/react"
                            className="mt-3 w-full"
                            text={brandingText}
                        />
                    </IonCol>
                    {/* <IonCol size="12" className="flex justify-center items-center w-full mt-4">
                        <button className="w-[40%] flex items-center justify-center bg-grayscale-900 text-white  py-3 mr-3 font-bold text-lg rounded-[40px] shadow-2xl">
                            <QRCodeScanner className="h-[25px] mr-2" /> Scan
                        </button>
                        <button className="flex items-center justify-center rounded-full border-solid border-grayscale-900 border-2 p-2 mr-3 bg-white shadow-2xl">
                            <img src={Print} alt="print icon" className="w-8 h-auto" />
                        </button>
                        <button className="flex items-center justify-center rounded-full border-solid border-grayscale-900 border-2 p-2 mr-3 bg-white shadow-2xl">
                            <Mail className="text-grayscale-900 w-8 h-auto" />
                        </button>
                        <button className="flex items-center justify-center rounded-full border-solid border-grayscale-900 border-2 p-2 mr-3 bg-white shadow-2xl">
                            <Share className="text-grayscale-900 w-8 h-auto" />
                        </button>
                    </IonCol> */}
                </IonRow>
            </IonContent>
        </>
    );
};

export default QrCodeUserCard;
