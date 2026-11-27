import React, { useState, useEffect } from 'react';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';
import { useLocation, useNavigate } from 'react-router';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

import X from 'learn-card-base/svgs/X';
import RibbonAwardIcon from 'learn-card-base/svgs/RibbonAwardIcon';
import Camera from 'learn-card-base/svgs/Camera';
import AddressBookQRCode from '../../../../../pages/addressBook/addressBook-qrcode/AddressBookQRCode';
import ScannerPermissionsPrompt from '../../../../../components/scanner-permissions-prompt/ScannerPermissionsPrompt';
import { getAppBaseUrl } from '../../../../../config/bootstrapTenantConfig';

import {
    BoostAddressBook,
    BoostAddressBookEditMode,
    BoostAddressBookViewMode,
} from './BoostAddressBook';

import { QRCodeScannerStore, useToast, ToastTypeEnum, useModal, ModalTypes } from 'learn-card-base';
import { BoostCMSIssueTo, BoostCMSState } from '../../../boost';

import { useWallet } from 'learn-card-base';
import { usePathQuery } from 'learn-card-base';
import { useGetCurrentLCNUser } from 'learn-card-base';

import { BoostUserTypeEnum } from 'learn-card-base';
import { LCNProfile } from '@learncard/types';
import { getLogger } from 'learn-card-base';
import * as m from '../../../../../paraglide/messages.js';
import { AppContent, AppFooter, AppHeader, AppPage, AppToolbar } from 'learn-card-base/ui/chrome';
import { AppCol, AppGrid, AppRow } from 'learn-card-base/ui/layout';
const log = getLogger('boost-address-book-contact-options');

const BoostAddressBookContactOptions: React.FC<{
    state: BoostCMSState;
    setIssueMode?: React.Dispatch<React.SetStateAction<BoostUserTypeEnum>>;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    handleCloseModal: () => void;
    showFixedFooter?: boolean;
    showCloseButton?: boolean;
    title?: string | React.ReactNode;
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

    const { presentToast } = useToast();
    const { currentLCNUser, currentLCNUserLoading } = useGetCurrentLCNUser();
    const [_issueTo, _setIssueTo] = useState<BoostCMSIssueTo[]>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
        (state as any)?.[collectionPropName]
    );
    const [walletDid, setWalletDid] = useState<string>('');
    const query = usePathQuery();
    const navigate = useNavigate();
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

    const { newModal: newQRCodeModal, closeModal: closeQRCodeModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });

    const { newModal: newAddressBookModal, closeModal: closeAddressBookModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });

    const { newModal: newScannerPromptModal, closeModal: closeScannerPromptModal } = useModal({
        mobile: ModalTypes.Cancel,
        desktop: ModalTypes.Cancel,
    });

    const openQRCodeModal = (isSheet: boolean) => {
        newQRCodeModal(<AddressBookQRCode handleCloseModal={closeQRCodeModal} />);
    };

    const openAddressBook = () => {
        newAddressBookModal(
            <BoostAddressBook
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
                state={state as any}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
                setState={setState as any}
                viewMode={BoostAddressBookViewMode.full}
                mode={BoostAddressBookEditMode.edit}
                handleCloseModal={(closeAddressBookOptionsModal: boolean = false) => {
                    closeAddressBookModal();
                    if (closeAddressBookOptionsModal) {
                        handleCloseModal();
                    }
                }}
                _issueTo={_issueTo}
                _setIssueTo={_setIssueTo}
                search={search}
                setSearch={setSearch}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
                searchResults={searchResults as any}
                isLoading={isLoading}
                collectionPropName={collectionPropName}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
                boostUri={(state as any).parentID?.boostUri ?? ''}
                recipients={[]}
                recipientsLoading={false}
            />
        );
    };

    const openScannerPromptModal = () => {
        newScannerPromptModal(
            <ScannerPermissionsPrompt
                handleCloseModal={closeScannerPromptModal}
                showScanner={showScanner}
            />
        );
    };

    const showScanner = async () => {
        handleCloseModal();
        QRCodeScannerStore.set.showScanner(true);
    };

    const [presentScannerPromptModal, dismissScannerPromptModal] = [() => {}, () => {}]; // Removed useIonModal

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
            openScannerPromptModal();
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
                string: `${getAppBaseUrl()}/connect?did=${walletDid}`,
            });
            presentToast(m['boostCMS.toasts.contactLinkCopied'](), {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (err) {
            presentToast(m['boostCMS.toasts.copyContactLinkFail'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const handleShare = async () => {
        if (Capacitor.isNativePlatform()) {
            await Share.share({
                title: m['share.addContact'](),
                text: '',
                url: `${getAppBaseUrl()}/connect?did=${walletDid}`,
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
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
                    const collection = (prevState as any)?.[collectionPropName] ?? [];
                    const userExistsInCollection = collection?.find(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
                        (users: any) => users?.profileId === selfProfile?.profileId
                    );

                    if (userExistsInCollection) return { ...prevState };

                    return {
                        ...prevState,
                        [collectionPropName]: [...collection, selfProfile],
                    };
                });

                handleCloseModal();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
            } catch (e: any) {
                log.debug('///Add yourself error', e);
                throw new Error('There was an error', e);
            }
        }
    };

    const handleAddSomeoneElse = () => {
        setIssueMode?.(BoostUserTypeEnum.someone);

        if (navigate) {
            const searchParams = new URLSearchParams(window.location.search);
            searchParams.set('boostUserType', BoostUserTypeEnum.someone);

            navigate(
                {
                    pathname: location?.pathname,
                    search: searchParams.toString(),
                },
                { replace: true }
            );
        }

        // Looping back to re-use BoostAddressBook here is insanity
        //   It's a big tangle right now though. Should eventually refactor to use BoostSearch
        openAddressBook();
    };

    return (
        <div>
            <AppGrid className="ion-padding">
                <AppRow className="w-full flex items-center justify-center">
                    {/* desktop */}
                    <button
                        onClick={() => handleAddYoself()}
                        className="flex items-center justify-center bg-indigo-500 rounded-full px-[18px] py-[12px] text-white text-2xl w-full shadow-lg font-medium"
                    >
                        <RibbonAwardIcon className="ml-[5px] h-[30px] w-[30px] mr-2" />{' '}
                        {m['boostCMS.boostMyself']()}
                    </button>
                </AppRow>
                <AppRow className="w-full flex items-center justify-center mt-4">
                    {/* desktop */}
                    <button
                        onClick={() => handleAddSomeoneElse()}
                        className="flex items-center justify-center bg-indigo-500 rounded-full px-[18px] py-[12px] text-white text-2xl w-full shadow-lg font-medium"
                    >
                        <RibbonAwardIcon className="ml-[5px] h-[30px] w-[30px] mr-2" />{' '}
                        {m['boostCMS.boostOthers']()}
                    </button>
                </AppRow>
                {/* <AppCol className="w-full flex items-center justify-center">
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
                    </AppCol> */}
                {Capacitor.isNativePlatform() && (
                    <AppCol className="w-full flex items-center justify-center mt-1">
                        <button
                            onClick={handleScan}
                            className="flex items-center justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white font-medium text-2xl w-full shadow-lg modal-btn-mobile"
                        >
                            <Camera className="ml-[5px] h-[30px] w-[30px] mr-2" />{' '}
                            {m['boostCMS.scanUserCode']()}
                        </button>
                    </AppCol>
                )}
                {/* <AppCol className="w-full flex items-center justify-center mt-1">
                        <button
                            onClick={handleShare}
                            className="flex items-center justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white font-mouse text-3xl w-full shadow-lg uppercase tracking-wide"
                        >
                            <LinkChain className="h-[30px] w-[30px] mr-2" /> Share Code
                        </button>
                    </AppCol> */}
            </AppGrid>
        </div>
    );
};

export default BoostAddressBookContactOptions;
