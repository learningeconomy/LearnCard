import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

import { IonPage, useIonModal } from '@ionic/react';
import Camera from 'learn-card-base/svgs/Camera';
import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import AddressBookQRCode from '../addressBook-qrcode/AddressBookQRCode';
import LinkChain from 'learn-card-base/svgs/LinkChain';
import ScannerPermissionsPrompt from 'apps/learn-card-app/src/components/scanner-permissions-prompt/ScannerPermissionsPrompt';
import Search from 'apps/learn-card-app/src/components/svgs/Search';
import ModalLayout from 'apps/learn-card-app/src/layout/ModalLayout';

import { QRCodeScannerStore } from 'learn-card-base';

import { useWallet, useToast, ToastTypeEnum } from 'learn-card-base';

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
                string: `https://learncard.app/connect?did=${walletDid}`,
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
                url: `https://learncard.app/connect?did=${walletDid}`,
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

    const addressBookMenuOptions: {
        id?: number;
        title?: string;
        icon?: React.ReactNode;
        onClick?: () => void;
    }[] = [
        {
            id: 1,
            title: 'Show Code',
            icon: <QRCodeScanner className="ml-[5px] h-[30px] w-[30px] mr-2" />,
            onClick: () => {
                presentCenterModal({
                    cssClass: 'generic-modal show-modal ion-disable-focus-trap',
                    backdropDismiss: false,
                    showBackdrop: false,
                });
            },
        },
    ];

    if (Capacitor.isNativePlatform()) {
        addressBookMenuOptions.push({
            id: 2,
            title: 'Scan Code',
            icon: <Camera className="ml-[5px] h-[30px] w-[30px] mr-2" />,
            onClick: () => {
                handleScan();
            },
        });
    }

    addressBookMenuOptions.push({
        id: 3,
        title: 'Share Code',
        icon: <LinkChain className="ml-[5px] h-[30px] w-[30px] mr-2" />,
        onClick: () => {
            handleShare();
        },
    });

    addressBookMenuOptions.push({
        id: 4,
        title: 'Search',
        icon: <Search className="ml-[5px] h-[24px] w-[25px] mr-2" />,
        onClick: () => {
            onSearchClick();
        },
    });

    return (
        <IonPage id="user-options-modal">
            <ModalLayout handleOnClick={handleCloseModal} allowScroll>
                <div className="flex w-full flex-col items-center justify-center mb-4">
                    <div className="flex w-full items-center justify-center">
                        <h1 className="font-poppins m-0 p-0 text-xl">Add Contact</h1>
                    </div>
                </div>
                <ul className="w-full flex flex-col items-center justify-center ion-padding">
                    {addressBookMenuOptions?.map(action => {
                        const { id, title, icon, onClick } = action;
                        return (
                            <li
                                key={id}
                                onClick={() => onClick?.()}
                                className="text-[17px] font-poppins w-full flex items-center justify-between py-3 px-2 border-b-grayscale-100 border-b-solid border-b-[2px] last:border-0"
                            >
                                <p className="text-grayscale-900">{title}</p>
                                {icon}
                            </li>
                        );
                    })}
                </ul>
            </ModalLayout>
        </IonPage>
    );
};

export default AddressBookContactOptions;
