import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

import { IonCol, IonPage, useIonModal } from '@ionic/react';
import Camera from 'learn-card-base/svgs/Camera';
import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import AddressBookQRCode from '../addressBook-qrcode/AddressBookQRCode';
import LinkChain from 'learn-card-base/svgs/LinkChain';
import ScannerPermissionsPrompt from '../../../components/scanner-permissions-prompt/ScannerPermissionsPrompt';

import { QRCodeScannerStore, useToast, ToastTypeEnum } from 'learn-card-base';

import { useWallet } from 'learn-card-base';
import Search from 'learn-card-base/svgs/Search';
import ModalLayout from '../../../layout/ModalLayout';

const AddressBookContactOptions: React.FC<{
    handleCloseModal: () => void;
    showSearch?: boolean;
    handleShowSearch?: () => void;
}> = ({ handleCloseModal, showSearch = true, handleShowSearch }) => {
    const { initWallet } = useWallet();
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

    const [presentCenterModal, dismissCenterModal] = useIonModal(AddressBookQRCode, {
        handleCloseModal: () => dismissCenterModal(),
        showCloseButton: true,
        title: (
            <p className="flex items-center justify-center text-2xl w-full h-full text-grayscale-900 text-center">
                Add Contact
            </p>
        ),
        subTitle: (
            <p className="flex items-center justify-center w-full h-full text-grayscale-900 text-center text-base">
                Have your contact scan this code.
            </p>
        ),
    });

    const showScanner = async () => {
        handleCloseModal();
        QRCodeScannerStore.set.showScanner(true);
    };

    const [presentScannerPromptModal, dismissScannerPromptModal] = useIonModal(
        ScannerPermissionsPrompt,
        {
            handleCloseModal: () => dismissScannerPromptModal(),
            showScanner: showScanner,
        }
    );

    const handleScan = async () => {
        const scannerPermissions = await BarcodeScanner.checkPermissions();

        if (scannerPermissions.camera === 'granted') {
            showScanner();
            return;
        } else if (
            scannerPermissions.camera === 'denied' ||
            scannerPermissions.camera === 'prompt'
        ) {
            handleCloseModal();
            presentScannerPromptModal({
                cssClass: 'generic-modal show-modal ion-disable-focus-trap',
                backdropDismiss: false,
                showBackdrop: false,
            });
            return;
        } else {
            const reqScannerPermissions = await BarcodeScanner.requestPermissions();

            if (reqScannerPermissions.camera === 'granted') {
                showScanner();
            }
        }
    };

    const copyToClipBoard = async () => {
        try {
            await Clipboard.write({
                string: `https://pass.scout.org/connect?did=${walletDid}`,
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
        if (Capacitor.isNativePlatform()) {
            await Share.share({
                title: 'Add contact',
                text: '',
                url: `https://pass.scout.org/connect?did=${walletDid}`,
                dialogTitle: '',
            });
        } else {
            copyToClipBoard();
        }
    };

    const onSearchClick = () => {
        handleCloseModal();
        setTimeout(() => {
            handleShowSearch?.();
        }, 500);
    };

    return (
        <IonPage id="user-options-modal">
            <ModalLayout handleOnClick={handleCloseModal}>
                <div className="flex w-full flex-col items-center justify-center mb-4">
                    <div className="flex w-full items-center justify-center">
                        <h6 className={`m-0 p-0 text-2xl font-medium font-rubik`}>Add Contact</h6>
                    </div>
                </div>
                <div className="w-full flex items-center justify-center px-4">
                    <button
                        onClick={() =>
                            presentCenterModal({
                                cssClass: 'generic-modal show-modal ion-disable-focus-trap',
                                backdropDismiss: false,
                                showBackdrop: false,
                            })
                        }
                        className="flex items-center justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] font-medium text-white text-2xl w-full shadow-lg"
                    >
                        <QRCodeScanner className="ml-[5px] h-[30px] w-[30px] mr-2" /> Show Code
                    </button>
                </div>

                {Capacitor.isNativePlatform() && (
                    <div className="w-full flex items-center justify-center mt-2 px-4">
                        <button
                            onClick={handleScan}
                            className="flex items-center justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white text-2xl w-full shadow-lg modal-btn-mobile"
                        >
                            <Camera className="ml-[5px] h-[30px] w-[30px] mr-2" /> Scan Code
                        </button>
                    </div>
                )}

                <div className="w-full flex items-center justify-center mt-2 px-4">
                    <button
                        onClick={handleShare}
                        className="flex items-center justify-center font-medium bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white text-2xl w-full shadow-lg"
                    >
                        <LinkChain className="ml-[5px] h-[30px] w-[30px] mr-2" /> Share Code
                    </button>
                </div>

                {showSearch && (
                    <div className="w-full flex items-center justify-center mt-2 px-4">
                        <button
                            onClick={onSearchClick}
                            className="flex items-center justify-center font-medium bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white text-2xl w-full shadow-lg"
                        >
                            <Search className="ml-[5px] h-[24px] w-[25px] mr-2" /> Search
                        </button>
                    </div>
                )}
            </ModalLayout>
        </IonPage>
    );
};

export default AddressBookContactOptions;
