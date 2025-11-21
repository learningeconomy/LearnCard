import React, { useState, useEffect } from 'react';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';
import { useLocation, useHistory } from 'react-router-dom';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

import {
    IonCol,
    IonContent,
    IonRow,
    IonGrid,
    IonToolbar,
    IonFooter,
    IonHeader,
    IonPage,
    useIonModal,
    useIonToast,
} from '@ionic/react';
import X from 'learn-card-base/svgs/X';
import RibbonAwardIcon from 'learn-card-base/svgs/RibbonAwardIcon';
import Camera from 'learn-card-base/svgs/Camera';
import AddressBookQRCode from '../../../../../pages/addressBook/addressBook-qrcode/AddressBookQRCode';
import ScannerPermissionsPrompt from '../../../../../components/scanner-permissions-prompt/ScannerPermissionsPrompt';

import {
    BoostAddressBook,
    BoostAddressBookEditMode,
    BoostAddressBookViewMode,
} from './BoostAddressBook';

import { QRCodeScannerStore } from 'learn-card-base';
import { BoostCMSIssueTo, BoostCMSState } from '../../../boost';

import { useWallet } from 'learn-card-base';
import { usePathQuery } from 'learn-card-base';
import { useGetCurrentLCNUser } from 'learn-card-base';

import { BoostUserTypeEnum } from 'learn-card-base';
import { LCNProfile } from '@learncard/types';

const BoostAddressBookContactOptions: React.FC<{
    state: BoostCMSState;
    setIssueMode?: React.Dispatch<React.SetStateAction<BoostUserTypeEnum>>;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    handleCloseModal: () => void;
    showFixedFooter?: boolean;
    showCloseButton?: boolean;
    title?: String | React.ReactNode;
    footer?: React.ReactNode;
    search?: string;
    setSearch?: React.Dispatch<React.SetStateAction<string>>;
    searchResults?: LCNProfile[];
    isLoading?: boolean;
    collectionPropName?: string;
}> = ({
    state,
    setIssueMode,
    setState,
    handleCloseModal,
    showCloseButton = true,
    title,
    showFixedFooter = false,
    footer,
    search,
    setSearch,
    searchResults,
    isLoading,
    collectionPropName = 'issueTo',
}) => {
    const { initWallet } = useWallet();

    const [presentToast] = useIonToast();
    const { currentLCNUser, currentLCNUserLoading } = useGetCurrentLCNUser();
    const [_issueTo, _setIssueTo] = useState<BoostCMSIssueTo[]>(state?.[collectionPropName]);
    const [walletDid, setWalletDid] = useState<string>('');
    const query = usePathQuery();
    const history = useHistory();
    const location = useLocation();

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
            <p className="font-mouse flex items-center justify-center text-2xl w-full h-full text-grayscale-900 text-center">
                Add Contact
            </p>
        ),
        subTitle: (
            <p className="flex items-center justify-center w-full h-full text-grayscale-900 text-center text-base">
                Have your contact scan this code.
            </p>
        ),
        collectionPropName,
    });

    const [presentSheetModal, dismissSheetModal] = useIonModal(AddressBookQRCode, {
        handleCloseModal: () => dismissSheetModal(),
        showCloseButton: false,
        title: (
            <p className="font-mouse flex items-center justify-center text-2xl w-full h-full text-grayscale-900 text-center">
                Add Contact
            </p>
        ),
        subTitle: (
            <p className="flex items-center justify-center w-full h-full text-grayscale-900 text-center text-base">
                Have your contact scan this code.
            </p>
        ),
        collectionPropName,
    });

    const [presentAddressBook, dismissAddressbook] = useIonModal(BoostAddressBook, {
        state: state,
        setState: setState,
        viewMode: BoostAddressBookViewMode.full,
        mode: BoostAddressBookEditMode.edit,
        handleCloseModal: (closeAddressBookOptionsModal: boolean = false) => {
            dismissAddressbook();
            if (closeAddressBookOptionsModal) {
                handleCloseModal();
            }
        },
        _issueTo: _issueTo,
        _setIssueTo: _setIssueTo,

        search,
        setSearch,
        searchResults,
        isLoading,
        collectionPropName,
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
            presentToast({
                message: 'Contact link copied to clipboard',
                duration: 3000,
                buttons: [
                    {
                        text: 'Dismiss',
                        role: 'cancel',
                    },
                ],
                position: 'top',
                cssClass: 'user-did-success-copy-toast',
            });
        } catch (err) {
            presentToast({
                message: 'Unable to copy Contact link to clipboard',
                duration: 3000,
                buttons: [
                    {
                        text: 'Dismiss',
                        role: 'cancel',
                    },
                ],
                position: 'top',
                cssClass: 'user-did-copy-success-toast',
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

    const fixedFooterStyles = showFixedFooter ? 'absolute bottom-[25%] left-0 w-full' : '';

    const handleAddYoself = () => {
        if (currentLCNUser) {
            const { profileId, did, displayName, image } = currentLCNUser;
            const selfProfile = {
                profileId,
                did,
                displayName,
                image,
            };

            try {
                setState(prevState => {
                    const collection = prevState?.[collectionPropName] ?? [];
                    const userExistsInCollection = collection?.find(
                        users => users?.profileId === selfProfile?.profileId
                    );

                    if (userExistsInCollection) return { ...prevState };

                    return {
                        ...prevState,
                        [collectionPropName]: [...collection, selfProfile],
                    };
                });

                handleCloseModal();
            } catch (e) {
                console.log('///Add yourself error', e);
                throw new Error('There was an error', e);
            }
        }
    };

    const handleAddSomeoneElse = () => {
        setIssueMode?.(BoostUserTypeEnum.someone);

        if (history) {
            let searchParams = new URLSearchParams(window.location.search);
            searchParams.set('boostUserType', BoostUserTypeEnum.someone);

            history.replace({
                pathname: location?.pathname,
                search: searchParams.toString(),
            });
        }

        // Looping back to re-use BoostAddressBook here is insanity
        //   It's a big tangle right now though. Should eventually refactor to use BoostSearch
        presentAddressBook();
    };

    return (
        <IonPage id="user-options-modal">
            <IonHeader className="ion-no-border bg-white pt-5">
                <IonRow className="w-full bg-white">
                    <IonCol className="w-full flex items-center justify-end">
                        {showCloseButton && (
                            <button onClick={handleCloseModal}>
                                <X className="text-grayscale-600 h-8 w-8" />
                            </button>
                        )}
                    </IonCol>
                </IonRow>
                {title && <IonToolbar color="#fffff">{title}</IonToolbar>}
            </IonHeader>
            <IonContent>
                <IonGrid className="ion-padding">
                    <IonRow className="w-full flex items-center justify-center mt-8">
                        {/* desktop */}
                        <button
                            onClick={() => handleAddYoself()}
                            className="flex items-center justify-center bg-indigo-500 rounded-full px-[18px] py-[12px] text-white text-2xl w-full shadow-lg font-medium"
                        >
                            <RibbonAwardIcon className="ml-[5px] h-[30px] w-[30px] mr-2" /> Boost
                            Myself
                        </button>
                    </IonRow>
                    <IonRow className="w-full flex items-center justify-center mt-4">
                        {/* desktop */}
                        <button
                            onClick={() => handleAddSomeoneElse()}
                            className="flex items-center justify-center bg-indigo-500 rounded-full px-[18px] py-[12px] text-white text-2xl w-full shadow-lg font-medium"
                        >
                            <RibbonAwardIcon className="ml-[5px] h-[30px] w-[30px] mr-2" /> Boost
                            Others
                        </button>
                    </IonRow>
                    {/* <IonCol className="w-full flex items-center justify-center">
                        <button
                            onClick={() =>
                                presentCenterModal({
                                    cssClass: 'center-modal user-qrcode-modal',
                                    backdropDismiss: false,
                                    showBackdrop: false,
                                })
                            }
                            className="flex items-center justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white font-mouse text-3xl w-full shadow-lg modal-btn-desktop uppercase"
                        >
                            <QRCodeScanner className="ml-[5px] h-[30px] w-[30px] mr-2" /> Show Code
                        </button>
                        <button
                            onClick={() => {
                                presentSheetModal({
                                    cssClass: 'mobile-modal user-options-modal',
                                    initialBreakpoint: 0.95,
                                    breakpoints: [0, 0.95, 0.95, 1],
                                    handleBehavior: 'cycle',
                                });
                            }}
                            className="flex items-center justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white font-mouse text-3xl w-full shadow-lg modal-btn-mobile uppercase tracking-wide"
                        >
                            <QRCodeScanner className="ml-[5px] h-[30px] w-[30px] mr-2" /> Show Code
                        </button>
                    </IonCol> */}
                    {Capacitor.isNativePlatform() && (
                        <IonCol className="w-full flex items-center justify-center mt-1">
                            <button
                                onClick={handleScan}
                                className="flex items-center justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white font-medium text-2xl w-full shadow-lg modal-btn-mobile"
                            >
                                <Camera className="ml-[5px] h-[30px] w-[30px] mr-2" /> Scan User
                                Code
                            </button>
                        </IonCol>
                    )}
                    {/* <IonCol className="w-full flex items-center justify-center mt-1">
                        <button
                            onClick={handleShare}
                            className="flex items-center justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white font-mouse text-3xl w-full shadow-lg uppercase tracking-wide"
                        >
                            <LinkChain className="h-[30px] w-[30px] mr-2" /> Share Code
                        </button>
                    </IonCol> */}
                    <div className="w-full flex items-center justify-center mt-8">
                        <button
                            onClick={() => handleCloseModal()}
                            className="text-grayscale-900 text-center text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </IonGrid>
            </IonContent>
            {footer && (
                <IonFooter className={fixedFooterStyles}>
                    <IonToolbar>{footer}</IonToolbar>
                </IonFooter>
            )}
        </IonPage>
    );
};

export default BoostAddressBookContactOptions;
