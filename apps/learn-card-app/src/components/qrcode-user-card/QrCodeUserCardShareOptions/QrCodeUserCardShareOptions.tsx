import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

import ShareModal from '../../share/ShareModal';
import QrCodeDownloadOptions from './QrCodeDownloadOptions';
import ScannerPermissionsPrompt from '../../scanner-permissions-prompt/ScannerPermissionsPrompt';

import {
    useModal,
    useWallet,
    ModalTypes,
    QRCodeScannerStore,
    useIsCurrentUserLCNUser,
} from 'learn-card-base';

import { useJoinLCNetworkModal } from '../../../components/network-prompts/hooks/useJoinLCNetworkModal';
import { userShareOptions, ShareOptionsEnum } from './user-share-options.helpers';

const QrCodeUserCardShareOptions: React.FC = () => {
    const { initWallet } = useWallet();
    const { data: currentLCNUser, isLoading: currentLCNUserLoading } = useIsCurrentUserLCNUser();

    const [walletDid, setWalletDid] = useState<string>('');

    const { handlePresentJoinNetworkModal } = useJoinLCNetworkModal();
    const { newModal, closeModal, closeAllModals } = useModal();

    // Fetch DID
    useEffect(() => {
        const getWalletDid = async () => {
            const wallet = await initWallet();
            setWalletDid(wallet?.id?.did());
        };

        if (!walletDid) getWalletDid();
    }, [walletDid]);

    // Share modal
    const presentShareModal = () => {
        newModal(
            <ShareModal />,
            { sectionClassName: '!max-w-[400px]' },
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
        );
    };

    const showDownloadOptions = () => {
        newModal(
            <QrCodeDownloadOptions />,
            { sectionClassName: '!max-w-[400px]' },
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
        );
    };

    // QR Scanner
    const showScanner = () => {
        closeModal();
        closeAllModals();
        QRCodeScannerStore.set.showScanner(true);
    };

    const handleScan = async () => {
        const scannerPermissions = await BarcodeScanner.checkPermissions();

        if (scannerPermissions.camera === 'granted') {
            showScanner();
            return;
        }

        if (scannerPermissions.camera === 'denied' || scannerPermissions.camera === 'prompt') {
            newModal(
                <ScannerPermissionsPrompt
                    handleCloseModal={closeModal}
                    showScanner={showScanner}
                />,
                { hideButton: true, sectionClassName: '!max-w-[400px]' }
            );
            return;
        }

        const reqScannerPermissions = await BarcodeScanner.requestPermissions();

        if (reqScannerPermissions.camera === 'granted') showScanner();
    };

    // Handle Share Option Clicks
    const handleShareOptionClick = (optionType: ShareOptionsEnum) => {
        if (!currentLCNUser && !currentLCNUserLoading) {
            closeModal();
            handlePresentJoinNetworkModal();
            return;
        }

        switch (optionType) {
            case ShareOptionsEnum.share:
                presentShareModal();
                break;
            case ShareOptionsEnum.download:
                showDownloadOptions();
                break;
            case ShareOptionsEnum.scan:
                handleScan();
                break;
        }
    };

    return (
        <div className="w-full flex items-center justify-center mt-6 px-6 pb-4">
            <div className="flex items-center justify-around w-full max-w-[400px]">
                {userShareOptions.map(option => {
                    if (option.type === ShareOptionsEnum.scan && !Capacitor.isNativePlatform()) {
                        return null;
                    }
                    return (
                        <div className="flex flex-col items-center" key={option.id}>
                            <button
                                onClick={() => handleShareOptionClick(option.type)}
                                className="bg-indigo-600 p-2 rounded-full h-[60px] w-[60px] flex items-center justify-center mb-2"
                            >
                                <option.icon className="w-[30px] text-white" />
                            </button>
                            <p className="text-grayscale-700 text-center text-[17px]">
                                {option.label}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default QrCodeUserCardShareOptions;
