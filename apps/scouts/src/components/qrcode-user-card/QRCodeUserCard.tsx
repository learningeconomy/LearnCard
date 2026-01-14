import React, { useEffect, useState } from 'react';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { QRCodeSVG } from 'qrcode.react';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

import { auth } from '../../firebase/firebase';
import { Clipboard } from '@capacitor/clipboard';
import {
    useWallet,
    QRCodeScannerStore,
    pushUtilities,
    useGetProfile,
    useIsCurrentUserLCNUser,
    ModalTypes,
    useModal,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';
import { useQueryClient } from '@tanstack/react-query';
import { IonCol, IonLoading } from '@ionic/react';
import { Capacitor } from '@capacitor/core';

import LinkChain from 'learn-card-base/svgs/LinkChain';
import Camera from '../svgs/Camera';
import ProfilePicture from 'learn-card-base/components/profilePicture/ProfilePicture';
import UserProfileSetup from '../user-profile/UserProfileSetup';

import { useWeb3AuthSFA } from 'learn-card-base';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import useSQLiteStorage from 'learn-card-base/hooks/useSQLiteStorage';

import authStore from 'learn-card-base/stores/authStore';

import { SocialLoginTypes } from 'learn-card-base/hooks/useSocialLogins';
import { LOGIN_REDIRECTS } from 'learn-card-base/constants/redirects';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { AddressBookContact } from '../../pages/addressBook/addressBookHelpers';
import ShareModal from '../share/ShareModal';
import ScannerPermissionsPrompt from '../scanner-permissions-prompt/ScannerPermissionsPrompt';
import { useCheckIfUserInNetwork } from '../network-prompts/hooks/useCheckIfUserInNetwork';

const QrCodeUserCard: React.FC<{
    handleQRCodeCardModal: () => void;
    branding: BrandingEnum;
    history: any;
    qrOnly?: boolean;
}> = ({ handleQRCodeCardModal, branding, history, qrOnly = false }) => {
    const { initWallet } = useWallet();
    const firebaseAuth = auth();
    const currentUser = useCurrentUser();
    const { logout } = useWeb3AuthSFA();
    const { clearDB } = useSQLiteStorage();
    const { presentToast } = useToast();
    const queryClient = useQueryClient();
    const { data: isCurrentUserLCNUser } =
        useIsCurrentUserLCNUser();
    const { data: currentLCNUser } = useGetProfile();
    const checkIfUserInNetwork = useCheckIfUserInNetwork();

    const [photo, setPhoto] = useState<string | undefined>(currentUser?.profileImage);

    const [connections, setConnections] = useState<AddressBookContact[]>([]);
    const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const { newModal: newEditModal, closeModal: closeEditModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const { newModal: newScannerPromptModal, closeModal: closeScannerPromptModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

    useEffect(() => {
        if (currentLCNUser && currentLCNUser?.image) {
            setPhoto(currentLCNUser?.image);
        }
    }, [currentLCNUser]);

    const presentEditAccountModal = () => {
        newEditModal(
            <UserProfileSetup
                title="My Account"
                handleCloseModal={() => closeEditModal()}
                showCloseButton={true}
                handleLogout={() => handleLogout()}
                showNetworkSettings={true}
                showNotificationsModal={false}
            />
        );
    };

    const handleShare = () => {
        newModal(
            <ShareModal handleCloseModal={closeModal} />,
            { sectionClassName: '!max-w-[400px]' },
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
        );
    };

    const showScannerOverlay = () => {
        handleQRCodeCardModal();
        QRCodeScannerStore.set.showScanner(true);
    };

    const presentScannerPromptModal = () => {
        newScannerPromptModal(
            <ScannerPermissionsPrompt
                handleCloseModal={() => closeScannerPromptModal()}
                showScanner={showScannerOverlay}
            />
        );
    };

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

    useEffect(() => {
        const loadConnections = async () => {
            const wallet = await initWallet();

            try {
                const connections = await wallet.invoke.getConnections();
                setConnections(connections);
            } catch (e) {
                console.log('getConnections::error', e);
            }
        };

        loadConnections();
    }, []);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        const typeOfLogin = authStore?.get?.typeOfLogin();
        const nativeSocialLogins = [
            SocialLoginTypes.apple,
            SocialLoginTypes.sms,
            SocialLoginTypes.passwordless,
            SocialLoginTypes.google,
        ];

        const redirectUrl =
            IS_PRODUCTION || Capacitor.getPlatform() === 'android'
                ? LOGIN_REDIRECTS[branding].redirectUrl
                : LOGIN_REDIRECTS[branding].devRedirectUrl;

        setTimeout(async () => {
            try {
                const deviceToken = authStore?.get?.deviceToken();
                if (deviceToken) {
                    try {
                        await pushUtilities.revokePushToken(initWallet, deviceToken);
                    } catch (e) {
                        console.error('Error revoking push token', e);
                    }
                }

                await firebaseAuth.signOut(); // sign out of web layer
                if (nativeSocialLogins.includes(typeOfLogin as any) && Capacitor.isNativePlatform()) {
                    try {
                        await FirebaseAuthentication?.signOut?.();
                    } catch (e) {
                        console.log('firebase::signout::error', e);
                    }
                }

                try {
                    await clearDB();
                    await queryClient.resetQueries();
                } catch (e) {
                    console.error(e);
                }

                await logout(redirectUrl);
            } catch (e) {
                console.error('There was an issue logging out', e);
                setIsLoggingOut(false);
                handleQRCodeCardModal();
                presentToast('Oops, we had an issue logging out.', {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            }
        }, 1000);
    };

    const handleScan = async () => {
        const scannerPermissions = await BarcodeScanner.checkPermissions();

        if (scannerPermissions.camera === 'granted') {
            showScannerOverlay();
            return;
        } else if (
            scannerPermissions.camera === 'denied' ||
            scannerPermissions.camera === 'prompt'
        ) {
            presentScannerPromptModal();
            return;
        } else {
            const reqScannerPermissions = await BarcodeScanner.requestPermissions();

            if (reqScannerPermissions.camera === 'granted') {
                showScannerOverlay();
            }
        }
    };

    const connectionsTitle = 'Contacts';

    return (
        <section className="pt-9 pb-4">
            <IonLoading mode="ios" message="Logging out..." isOpen={isLoggingOut} />
            <div className="flex w-full flex-col items-center justify-center">
                <ProfilePicture
                    customContainerClass="flex justify-center items-center h-[80px] w-[80px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-4xl min-w-[80px] min-h-[80px]"
                    customImageClass="flex justify-center items-center h-[80px] w-[80px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[80px] min-h-[80px]"
                    customSize={500}
                    overrideSrc={(photo?.length || 0) > 0}
                    overrideSrcURL={photo}
                />
                <p
                    className={`text-xl text-center font-medium mt-3 w-full text-indigo-900 ${
                        qrOnly ? 'pb-1 mb-4' : ''
                    }`}
                >
                    {currentUser?.name || currentUser?.email}
                </p>
                {!qrOnly && (
                    <div className="flex items-center justify-center w-full mb-2">
                        <button
                            onClick={() => presentEditAccountModal()}
                            className="mr-1 text-indigo-500 font-semibold text-lg text-center"
                        >
                            Edit Info <span className="text-indigo-500">•</span>
                        </button>

                        <button
                            onClick={() => {
                                handleQRCodeCardModal();
                                setTimeout(() => {
                                    history.push('/contacts');
                                }, 800);
                            }}
                            className="mr-1 text-indigo-500 font-semibold text-lg text-center"
                        >
                            {connectionsTitle}
                            &nbsp;<span className="text-indigo-500">•</span>
                        </button>

                        <button
                            onClick={handleLogout}
                            className="text-center font-semibold text-indigo-500 text-lg"
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>

            <div className="flex flex-col justify-center items-center w-full relative px-8 mb-5">
                <div className="max-w-[90%] w-full h-auto relative">
                    <QRCodeSVG
                        className="h-full w-full"
                        value={`https://pass.scout.org/connect?connect=true&did=${walletDid}`}
                        data-testid="qrcode-card"
                        bgColor="transparent"
                    />
                </div>
                <p className="font-rubik text-lg text-gray-800 mt-4">Scan to connect</p>
            </div>

            <div className="w-full flex items-center justify-center">
                <div className="flex justify-center items-center w-full max-w-[400px] px-4">
                    {Capacitor.isNativePlatform() && (
                        <button
                            onClick={handleScan}
                            className="flex flex-1 items-center justify-center bg-grayscale-900 text-white py-2 mr-3 text-2xl font-medium tracking-wider rounded-[40px] shadow-2xl"
                        >
                            <Camera className="h-[25px] mr-2" /> Scan
                        </button>
                    )}

                    <button
                        onClick={e => {
                            e.preventDefault();

                            if (!checkIfUserInNetwork()) return;

                            if (isCurrentUserLCNUser) {
                                handleShare();
                            }
                        }}
                        className="flex flex-1 items-center justify-center bg-grayscale-900 text-white py-2 text-2xl rounded-[40px] font-medium"
                    >
                        <LinkChain className="h-[25px] mr-2" /> Share
                    </button>
                </div>
            </div>
        </section>
    );
};

export default QrCodeUserCard;
