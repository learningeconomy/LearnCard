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
import { QRCodeCard } from '@learncard/react';
import LeftArrow from 'learn-card-base/svgs/LeftArrow';
import ProfilePicture from 'learn-card-base/components/profilePicture/ProfilePicture';

import { useAuthCoordinator } from 'learn-card-base/auth-coordinator';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import useSQLiteStorage from 'learn-card-base/hooks/useSQLiteStorage';

import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

const QrCodeUserCard: React.FC<{
    handleQRCodeCardModal: () => void;
}> = ({ handleQRCodeCardModal }) => {
    const { logout: coordinatorLogout } = useAuthCoordinator();
    const { clearDB } = useSQLiteStorage();
    const currentUser = useCurrentUser();
    const brandingConfig = useBrandingConfig();

    const brandingText = brandingConfig.headerText ?? undefined;

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
                                    handleQRCodeCardModal();

                                    coordinatorLogout();
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
