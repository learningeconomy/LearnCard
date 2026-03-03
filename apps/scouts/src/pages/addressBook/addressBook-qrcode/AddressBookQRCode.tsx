import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';

import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { useWallet, useToast, ToastTypeEnum } from 'learn-card-base';

import { IonCol, IonRow, IonPage } from '@ionic/react';
import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import { ProfilePicture } from 'learn-card-base/components/profilePicture/ProfilePicture';
import ModalLayout from '../../../layout/ModalLayout';

const AddressBookQRCode: React.FC<{
    handleCloseModal: () => void;
}> = ({ handleCloseModal }) => {
    const { initWallet } = useWallet();
    const currentUser = useCurrentUser();
    const { presentToast } = useToast();

    const [walletDid, setWalletDid] = useState<string>('');

    useEffect(() => {
        const getWalletDid = async () => {
            const wallet = await initWallet();
            setWalletDid(wallet?.id?.did());
        };

        if (!walletDid) {
            getWalletDid();
        }
    }, [walletDid]);

    const copyToClipBoard = async () => {
        const wallet = await initWallet();

        try {
            await Clipboard.write({
                string: `https://pass.scout.org/connect?did=${wallet?.id?.did()}`,
            });
            presentToast('Contact link copied to clipboard', {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (err) {
            presentToast('Unable to copy Contact link to clipboard', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const handleShare = async () => {
        const wallet = await initWallet();

        if (Capacitor.isNativePlatform()) {
            await Share.share({
                title: 'Add contact',
                text: '',
                url: `https://pass.scout.org/connect?did=${wallet?.id?.did()}`,
                dialogTitle: '',
            });
        } else {
            copyToClipBoard();
        }
    };

    return (
        <IonPage>
            <ModalLayout handleOnClick={handleCloseModal} allowScroll>
                <div className="flex w-full flex-col items-center justify-center">
                    <div className="flex flex-col w-full items-center justify-center">
                        <h6 className={`m-0 p-0 text-2xl font-medium font-rubik`}>Add Contact</h6>
                        <p className="m-0 p-0">Have your contact scan this code.</p>
                    </div>
                </div>
                <IonRow className="flex items-center justify-center w-full">
                    <IonCol className="w-full flex items-center justify-center">
                        <ProfilePicture
                            customContainerClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-4xl"
                            customImageClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden object-cover border-white border-solid border-2"
                            customSize={500}
                        />
                    </IonCol>
                </IonRow>
                <IonRow className="flex items-center justify-center w-full">
                    <IonCol className="w-full flex items-center justify-center">
                        <p className="text-grayscale-900 text-xl font-medium">
                            {currentUser?.name || currentUser?.email}
                        </p>
                    </IonCol>
                </IonRow>
                <div className="flex justify-center items-center w-full relative px-10 mb-5 mt-5">
                    <div className="max-w-[90%] w-full h-auto relative user-qr-code-modal-qr-wrap">
                        <QRCodeSVG
                            className="h-full w-full"
                            value={`https://pass.scout.org/connect?connect=true&did=${walletDid}`}
                            data-testid="qrcode-card"
                            bgColor="transparent"
                        />
                    </div>
                </div>
                <div className="flex items-center justify-center w-full mt-3">
                    <div className="flex items-center justify-center w-full px-5">
                        <h2 className="divider-with-text">
                            <span>or</span>
                        </h2>
                    </div>
                </div>
                <IonCol className="w-full flex items-center justify-center mt-2">
                    <button
                        onClick={handleShare}
                        className="flex items-center font-medium justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white text-2xl w-[90%] shadow-lg max-w-[320px] font-rubik"
                    >
                        <QRCodeScanner className="ml-[5px] h-[30px] w-[30px] mr-2" />
                        Share Code
                    </button>
                </IonCol>
            </ModalLayout>
        </IonPage>
    );
};

export default AddressBookQRCode;
