import React, { useEffect, useState } from 'react';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { QRCodeSVG } from 'qrcode.react';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

import { auth } from '../../firebase/firebase';
import { Clipboard } from '@capacitor/clipboard';
import { useWallet, QRCodeScannerStore, pushUtilities, ModalTypes } from 'learn-card-base';
import { useQueryClient } from '@tanstack/react-query';
import { IonCol, useIonModal, useIonToast, IonLoading } from '@ionic/react';
import { Capacitor } from '@capacitor/core';

import Camera from '../svgs/Camera';
import NewMyData from '../new-my-data/NewMyData';
import ShareModal from '../share/ShareModal';
import UploadIcon from 'learn-card-base/svgs/UploadIcon';
import ProfilePicture from 'learn-card-base/components/profilePicture/ProfilePicture';
import UserProfileSetup from '../user-profile/UserProfileSetup';
import ScannerPermissionsPrompt from '../scanner-permissions-prompt/ScannerPermissionsPrompt';

import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import useSQLiteStorage from 'learn-card-base/hooks/useSQLiteStorage';
import { useJoinLCNetworkModal } from '../../components/network-prompts/hooks/useJoinLCNetworkModal';
import { useIsCurrentUserLCNUser } from 'learn-card-base';
import { useWeb3AuthSFA, useModal } from 'learn-card-base';

import authStore from 'learn-card-base/stores/authStore';

import { SocialLoginTypes } from 'learn-card-base/hooks/useSocialLogins';
import { LOGIN_REDIRECTS } from 'learn-card-base/constants/redirects';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { AddressBookContact } from '../../pages/addressBook/addressBookHelpers';

import useTheme from '../../theme/hooks/useTheme';

type QrCodeUserCardProps = {
    branding: BrandingEnum;
    connections: AddressBookContact[];
    history: any;
    qrOnly: boolean;
};

const QrCodeUserCard: React.FC<QrCodeUserCardProps> = ({
    branding,
    history,
    connections,
    qrOnly,
}) => {
    const { initWallet } = useWallet();
    const firebaseAuth = auth();
    const currentUser = useCurrentUser();
    const { logout } = useWeb3AuthSFA();
    const { clearDB } = useSQLiteStorage();
    const [presentToast] = useIonToast();
    const queryClient = useQueryClient();
    const { data: currentLCNUser, isLoading: currentLCNUserLoading } = useIsCurrentUserLCNUser();
    const { handlePresentJoinNetworkModal } = useJoinLCNetworkModal();

    const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

    const { newModal, closeModal, closeAllModals } = useModal();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const [presentEditAccountModal, dismissEditAccountModal] = useIonModal(UserProfileSetup, {
        title: 'My Account',
        handleCloseModal: () => dismissEditAccountModal(),
        showCloseButton: false,
        handleLogout: () => handleLogout(),
        showNetworkSettings: true,
        showNotificationsModal: false,
    });

    const presentShareModal = () => {
        newModal(
            <ShareModal />,
            { sectionClassName: '!max-w-[400px]' },
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
        );
    };

    const showScanner = () => {
        closeModal();
        closeAllModals();
        QRCodeScannerStore.set.showScanner(true);
    };

    const [presentScannerPromptModal, dismissScannerPromptModal] = useIonModal(
        ScannerPermissionsPrompt,
        {
            handleCloseModal: () => dismissScannerPromptModal(),
            showScanner: showScanner,
        }
    );

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

    const handleLogout = async () => {
        console.log('logging out');
        setIsLoggingOut(true);
        console.log(1);
        const typeOfLogin = authStore?.get?.typeOfLogin();
        console.log(2);
        const nativeSocialLogins = [
            SocialLoginTypes.apple,
            SocialLoginTypes.sms,
            SocialLoginTypes.passwordless,
            SocialLoginTypes.google,
        ];
        console.log(3);

        const redirectUrl =
            IS_PRODUCTION || Capacitor.getPlatform() === 'android'
                ? LOGIN_REDIRECTS[branding].redirectUrl
                : LOGIN_REDIRECTS[branding].devRedirectUrl;
        console.log(4);

        setTimeout(async () => {
            try {
                console.log(5);
                const deviceToken = authStore?.get?.deviceToken();
                console.log(6);
                if (deviceToken) {
                    try {
                        console.log(7);
                        await pushUtilities.revokePushToken(initWallet, deviceToken);
                    } catch (e) {
                        console.log(8);
                        console.error('Error revoking push token', e);
                    }
                }

                console.log(9);
                await firebaseAuth.signOut(); // sign out of web layer
                console.log(10);
                if (nativeSocialLogins.includes(typeOfLogin) && Capacitor.isNativePlatform()) {
                    try {
                        console.log(11);
                        await FirebaseAuthentication?.signOut?.();
                    } catch (e) {
                        console.log(12);
                        console.log('firebase::signout::error', e);
                    }
                }

                try {
                    console.log(13);
                    await clearDB();
                    console.log(14);
                    queryClient.clear();
                } catch (e) {
                    console.log(15);
                    console.error(e);
                }

                console.log('don');
                await logout(redirectUrl);
            } catch (e) {
                console.error('There was an issue logging out', e);
                setIsLoggingOut(false);
                closeModal();
                presentToast({
                    message: `Oops, we had an issue logging out.`,
                    duration: 3000,
                    cssClass: 'login-link-warning-toast ion-toast-bottom-nav-offset',
                });
            }
        }, 1000);
    };

    const copyToClipBoard = async () => {
        try {
            await Clipboard.write({
                string: currentLCNUser?.profileId,
            });
            presentToast({
                message: 'DID copied to clipboard',
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
                message: 'Unable to copy DID to clipboard',
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

    const handleScan = async () => {
        const scannerPermissions = await BarcodeScanner.checkPermissions();

        if (scannerPermissions.camera === 'granted') {
            showScanner();
            return;
        } else if (
            scannerPermissions.camera === 'denied' ||
            scannerPermissions.camera === 'prompt'
        ) {
            newModal(
                <ScannerPermissionsPrompt
                    handleCloseModal={closeModal}
                    showScanner={showScanner}
                />,
                { hideButton: true }
            );

            return;
        } else {
            const reqScannerPermissions = await BarcodeScanner.requestPermissions();

            if (reqScannerPermissions.camera === 'granted') {
                showScanner();
            }
        }
    };

    const connectionsCount = connections?.length ?? 0;
    const connectionsTitle = connectionsCount === 1 ? 'Contact' : 'Contacts';

    return (
        <section className="pt-9 pb-4">
            <IonLoading mode="ios" message="Logging out..." isOpen={isLoggingOut} />
            <div className="flex w-full flex-col items-center justify-center">
                <ProfilePicture
                    customContainerClass="flex justify-center items-center h-[80px] w-[80px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-4xl min-w-[80px] min-h-[80px]"
                    customImageClass="flex justify-center items-center h-[80px] w-[80px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[80px] min-h-[80px]"
                    customSize={164}
                />
                <p
                    className={`text-xl text-center font-medium mt-3 w-full text-indigo-900 ${
                        qrOnly ? 'mb-4' : ''
                    }`}
                >
                    {currentUser?.name || currentUser?.email}
                </p>
                {!qrOnly && (
                    <>
                        <button
                            type="button"
                            onClick={() => {
                                closeModal();
                                setTimeout(() => {
                                    history.push('/contacts');
                                }, 800);
                            }}
                            className="text-sm text-center font-medium mt-3 w-full text-indigo-900"
                        >
                            {connectionsCount} {connectionsTitle}
                        </button>

                        <div className="flex items-center justify-center w-full mb-2">
                            <button
                                onClick={() => {
                                    closeModal();
                                    presentEditAccountModal({
                                        cssClass: 'generic-modal show-modal ion-disable-focus-trap',
                                        backdropDismiss: true,
                                    });
                                }}
                                className={`mr-1 text-${primaryColor} font-semibold text-lg text-center`}
                            >
                                My Account
                            </button>

                            <button
                                onClick={() => {
                                    closeModal();
                                    newModal(
                                        <NewMyData />,
                                        { sectionClassName: '!max-w-[350px]' },
                                        { desktop: ModalTypes.Cancel }
                                    );
                                }}
                                className={`mr-1 text-${primaryColor} font-semibold text-lg text-center`}
                            >
                                <span className={`mr-1 text-${primaryColor}`}>•</span>
                                My Data
                            </button>
                        </div>
                    </>
                )}
            </div>

            <div className="flex justify-center items-center w-full relative px-8 mb-5">
                <div className="max-w-[80%] w-full h-auto relative">
                    <QRCodeSVG
                        className="h-full w-full"
                        value={`https://learncard.app/connect?connect=true&did=${walletDid}`}
                        data-testid="qrcode-card"
                        bgColor="transparent"
                    />
                </div>
            </div>

            {currentLCNUser?.profileId && (
                <div className="flex items-center justify-center w-full px-[28px]">
                    <IonCol className="w-full flex items-center justify-between px-4 rounded-2xl">
                        <div className="w-[80%] flex flex-col justify-center items-start text-left">
                            <p className="w-full text-grayscale-900 line-clamp-1 font-semibold">
                                @{currentLCNUser?.profileId}
                            </p>
                        </div>
                    </IonCol>
                </div>
            )}

            <div className="w-full flex items-center justify-center">
                <IonCol className="flex justify-center items-center w-full mt-4 max-w-[400px] px-4">
                    {Capacitor.isNativePlatform() && (
                        <button
                            onClick={handleScan}
                            className="flex flex-1 items-center justify-center bg-grayscale-900 text-white py-2 mr-3 text-xl tracking-wider rounded-[40px] shadow-2xl normal font-poppins"
                        >
                            <Camera className="h-[25px] mr-2" /> Scan
                        </button>
                    )}

                    <button
                        onClick={e => {
                            e.preventDefault();

                            if (!currentLCNUser && !currentLCNUserLoading) {
                                closeModal();
                                handlePresentJoinNetworkModal();
                                return;
                            }
                            if (currentLCNUser) {
                                closeModal();
                                presentShareModal({
                                    showBackdrop: false,
                                    cssClass: 'generic-modal show-modal ion-disable-focus-trap',
                                    backdropDismiss: true,
                                });
                            }
                        }}
                        className="flex flex-1 items-center justify-center bg-grayscale-900 text-white py-2 text-xl tracking-wider rounded-[40px] shadow-2xl normal font-poppins"
                    >
                        <UploadIcon className="h-[25px] mr-2" /> Share
                    </button>
                </IonCol>
            </div>

            {!qrOnly && (
                <button
                    onClick={handleLogout}
                    className={`text-center font-semibold text-${primaryColor} text-lg w-full py-4`}
                >
                    Logout
                </button>
            )}
        </section>
    );
};

export default QrCodeUserCard;
