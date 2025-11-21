import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase/firebase';
import { updateProfile } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { z } from 'zod';
import { Clipboard } from '@capacitor/clipboard';

import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import {
    SocialLoginTypes,
    authStore,
    currentUserStore,
    useSQLiteStorage,
    useWallet,
    getNotificationsEndpoint,
    useGetProfile,
    ModalTypes,
    useModal,
} from 'learn-card-base';

import { IonCol, IonRow, useIonModal, IonInput, IonSpinner, useIonToast } from '@ionic/react';
import CopyStack from '../svgs/CopyStack';
import InfoIcon from '../svgs/InfoIcon';
import TrashBin from '../svgs/TrashBin';
import Pencil from '../svgs/Pencil';
import HandshakeIcon from '../svgs/HandshakeIcon';

import { ProfilePicture } from 'learn-card-base/components/profilePicture/ProfilePicture';
import DeleteUserConfirmationPrompt from '../userOptions/DeleteUserConfirmationPrompt';
import { JoinNetworkModalWrapper } from '../network-prompts/hooks/useJoinLCNetworkModal';

import { useFilestack, UploadRes } from 'learn-card-base';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';
import { getAuthToken } from 'learn-card-base/helpers/authHelpers';

import BoostTextSkeleton from 'learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons';

const StateValidator = z.object({
    name: z
        .string()
        .nonempty(' Name is required.')
        .min(3, ' Must contain at least 3 character(s).')
        .max(30, ' Must contain at most 30 character(s).')
        .regex(/^[A-Za-z0-9 ]+$/, ' Alpha numeric characters(s) only'),
});

type UserProfileUpdateFormProps = {
    title?: string;
    handleCloseModal: () => void;
    handleLogout: () => void;
    showCancelButton?: boolean;
    showDeleteAccountButton?: boolean;
    showNetworkModal?: boolean;
    showNotificationsModal?: boolean;
    handleChapiInfo: () => void;
    children?: any;
};

const UserProfileUpdateForm: React.FC<UserProfileUpdateFormProps> = ({
    title,
    handleCloseModal,
    handleLogout,
    showCancelButton = true,
    showDeleteAccountButton = true,
    showNetworkModal = false,
    showNotificationsModal = true,
    handleChapiInfo,
    children,
}) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });
    const { initWallet, installChapi } = useWallet();
    const authToken = getAuthToken();
    const currentUser = useCurrentUser();
    const { updateCurrentUser } = useSQLiteStorage();
    const [presentToast] = useIonToast();

    const [name, setName] = useState<string | null | undefined>(currentUser?.name ?? '');
    const [photo, setPhoto] = useState<string | null | undefined>(currentUser?.profileImage ?? '');
    const [email, setEmail] = useState<string | null | undefined>(currentUser?.email ?? '');
    const [phone, setPhone] = useState<string | null | undefined>(currentUser?.phoneNumber ?? '');
    const [walletDid, setWalletDid] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    const [uploadProgress, setUploadProgress] = useState<number | false>(false);

    const { data: lcNetworkProfile, isLoading: profileLoading } = useGetProfile();

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
        if (lcNetworkProfile && lcNetworkProfile?.image) {
            setPhoto(lcNetworkProfile?.image);
        }
    }, []);

    const onUpload = (data: UploadRes) => {
        setPhoto(data?.url);
        setUploadProgress(false);
    };

    const { handleFileSelect: handleImageSelect, isLoading: imageUploadLoading } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data) => onUpload(data),
        options: { onProgress: event => setUploadProgress(event.totalPercent) },
    });

    const [presentCenterModal, dismissCenterModal] = useIonModal(DeleteUserConfirmationPrompt, {
        handleCloseModal: () => dismissCenterModal(),
        handleLogout: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => onLogout(e),
    });

    const [presentNetworkModal, dismissNetworkModal] = useIonModal(JoinNetworkModalWrapper, {
        handleCloseModal: () => dismissNetworkModal(),
        showNotificationsModal: showNotificationsModal,
    });

    const validate = () => {
        const parsedData = StateValidator.safeParse({
            name: name,
        });

        if (parsedData.success) {
            setErrors({});
            return true;
        }

        if (parsedData.error) {
            setErrors(parsedData.error.flatten().fieldErrors);
        }

        return false;
    };

    const onCloseModal = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        handleCloseModal();
    };

    const onLogout = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        onCloseModal(e);
        handleLogout();
    };

    const handleStorageUpdate = async () => {
        await updateCurrentUser(currentUser?.privateKey, {
            name: name ?? currentUser?.name ?? '',
            profileImage: photo ?? currentUser?.profileImage ?? '',
        });
        currentUserStore.set.currentUser({
            ...currentUser,
            name: name ?? currentUser?.name ?? '',
            profileImage: photo ?? currentUser?.profileImage ?? '',
        });
    };

    const handleLCNetworkProfileUpdate = async () => {
        const wallet = await initWallet();

        if (lcNetworkProfile && lcNetworkProfile?.profileId) {
            await wallet?.invoke?.updateProfile({
                displayName: name,
                image: photo,
                notificationsWebhook: getNotificationsEndpoint(),
            });
        }
    };

    const handleUpdateUser = async () => {
        const typeOfLogin = authStore.get.typeOfLogin();

        // ! APPLE HOT FIX
        if (typeOfLogin === SocialLoginTypes.apple) {
            // ! apple's guidelines: name should NOT be required
            await updateProfile(auth()?.currentUser, {
                displayName: name ?? '',
                photoURL: photo ?? '',
            });

            handleStorageUpdate();

            // update LC network profile
            await handleLCNetworkProfileUpdate();

            setIsLoading(false);
            handleCloseModal();
            // ! APPLE HOT FIX
        } else {
            if (validate()) {
                setIsLoading(true);
                try {
                    if (authToken === 'dummy') {
                        currentUserStore.set.currentUser({
                            ...currentUser,
                            name: name ?? currentUser?.name ?? '',
                            profileImage: photo ?? currentUser?.profileImage ?? '',
                        });

                        // update LC network profile
                        await handleLCNetworkProfileUpdate();

                        setIsLoading(false);
                        handleCloseModal();
                        if (showNetworkModal) {
                            presentNetworkModal({
                                cssClass: 'generic-modal show-modal ion-disable-focus-trap',
                                backdropDismiss: false,
                                showBackdrop: false,
                            });
                        }
                    } else {
                        // update firebase profile
                        await updateProfile(auth()?.currentUser, {
                            displayName: name,
                            photoURL: photo,
                        });
                        // }

                        // update LC network profile
                        await handleLCNetworkProfileUpdate();

                        // update sqlite + context store
                        handleStorageUpdate();

                        setIsLoading(false);
                        handleCloseModal();
                        if (showNetworkModal) {
                            presentNetworkModal({
                                cssClass: 'generic-modal show-modal ion-disable-focus-trap',
                                backdropDismiss: false,
                                showBackdrop: false,
                            });
                        }
                    }
                } catch (error) {
                    setIsLoading(false);
                    console.log('updateProfile::error', error);
                }
            }
        }
    };

    const copyToClipBoard = async () => {
        try {
            await Clipboard.write({
                string: walletDid,
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

    return (
        <>
            <IonRow class="w-full">
                <IonCol>
                    <p className="text-grayscale-900 font-notoSans m-0 flex h-full w-full items-center justify-center text-center text-xl font-bold">
                        {title}
                    </p>
                </IonCol>
                <IonCol size="12" className="flex items-center justify-center">
                    <div className="bg-grayscale-100/40 relative m-0 flex items-center justify-between rounded-[40px] object-fill p-0 pb-[3px] pr-[10px] pt-[3px]">
                        <ProfilePicture
                            customContainerClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-3xl min-w-[70px] min-h-[70px]"
                            customImageClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[70px] min-h-[70px]"
                            customSize={500}
                            overrideSrc={photo?.length > 0}
                            overrideSrcURL={photo}
                        >
                            {imageUploadLoading && (
                                <div className="user-image-upload-inprogress absolute flex h-[70px] min-h-[70px] w-[70px] min-w-[70px] items-center justify-center overflow-hidden rounded-full border-2 border-solid border-white text-3xl font-medium text-white">
                                    <IonSpinner
                                        name="crescent"
                                        color="dark"
                                        className="scale-[1.75]"
                                    />
                                </div>
                            )}
                        </ProfilePicture>
                        <button
                            onClick={handleImageSelect}
                            type="button"
                            className="text-grayscale-900 ml-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg"
                        >
                            <Pencil className="h-[60%]" />
                        </button>
                    </div>
                </IonCol>
            </IonRow>

            {children}

            {!Capacitor.isNativePlatform() && (
                <div className="w-full flex items-center justify-between px-6">
                    <button
                        onClick={installChapi}
                        className="flex items-center justify-center text-white rounded-full px-[18px] py-[12px] bg-grayscale-900 text-xl w-[85%] shadow-lg"
                    >
                        <HandshakeIcon className="mr-2" /> Connect Handler
                    </button>
                    <button
                        onClick={handleChapiInfo}
                        className="flex items-center justify-center text-grayscale-900 text-3xl"
                    >
                        <InfoIcon />
                    </button>
                </div>
            )}

            <form
                onSubmit={e => {
                    e.preventDefault();
                    handleUpdateUser();
                }}
                className="flex flex-col items-center justify-center w-full px-6 mt-4 mb-4"
            >
                <IonRow className="flex flex-col items-center justify-center w-full">
                    {profileLoading && (
                        <BoostTextSkeleton
                            containerClassName="w-full min-h-[52px] h-[52px] rounded-[15px] mb-4"
                            skeletonStyles={{ width: '100%', height: '100%', borderRadius: '15px' }}
                        />
                    )}
                    {lcNetworkProfile && lcNetworkProfile?.profileId && !profileLoading && (
                        <IonInput
                            autocapitalize="on"
                            className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base mb-4`}
                            value={`@${lcNetworkProfile?.profileId}`}
                            placeholder="User ID"
                            type="text"
                            disabled={true}
                        />
                    )}
                    <div className="flex flex-col items-center justify-center w-full mb-4">
                        <IonInput
                            autocapitalize="on"
                            className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base ${
                                errors.name ? 'login-input-email-error' : ''
                            }`}
                            onIonInput={e => setName(e.detail.value)}
                            value={name}
                            placeholder="Full Name"
                            type="text"
                        />
                        {errors.name && (
                            <p className="p-0 m-0 w-full text-left mt-1 text-red-600">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {walletDid && (
                        <IonRow className="flex items-center justify-center w-full bg-grayscale-100 mb-4 rounded-[15px]">
                            <IonCol className="w-full flex items-center justify-between px-4 rounded-2xl">
                                <div className="w-[80%] flex flex-col justify-center items-start text-left">
                                    <p className="text-grayscale-500 font-medium text-sm">
                                        ScoutPass Number (DID)
                                    </p>
                                    <p className="w-full text-grayscale-900 line-clamp-1 tracking-widest">
                                        {walletDid}
                                    </p>
                                </div>
                                <div
                                    onClick={copyToClipBoard}
                                    className="w-[20%] flex items-center justify-end"
                                >
                                    <CopyStack className="w-[32px] h-[32px] text-grayscale-900" />
                                </div>
                            </IonCol>
                        </IonRow>
                    )}
                    {email && (
                        <IonInput
                            autocapitalize="on"
                            className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base mb-4`}
                            onIonInput={e => setEmail(e.detail.value)}
                            value={email}
                            placeholder="Email address"
                            type="email"
                            disabled={true}
                        />
                    )}
                    {phone && (
                        <IonInput
                            autocapitalize="on"
                            className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base mb-4`}
                            onIonInput={e => setPhone(e.detail.value)}
                            value={phone}
                            placeholder="Phone Number"
                            type="tel"
                            disabled={true}
                        />
                    )}
                </IonRow>
                {showDeleteAccountButton && (
                    <IonRow className="w-full flex items-center justify-center">
                        <button
                            type="button"
                            onClick={e => {
                                e.stopPropagation();
                                e.preventDefault();
                                newModal(
                                    <DeleteUserConfirmationPrompt
                                        handleCloseModal={() => closeModal()}
                                        handleLogout={(
                                            e: React.MouseEvent<HTMLButtonElement, MouseEvent>
                                        ) => onLogout(e)}
                                    />
                                );
                            }}
                            className="flex items-center justify-center bg-white rounded-full px-[18px] py-[12px] text-grayscale-900 text-2xl w-full shadow-lg"
                        >
                            <TrashBin className="ml-[5px] h-[30px] w-[30px] mr-2" />
                            Delete Account
                        </button>
                    </IonRow>
                )}

                <IonRow className="w-full flex items-center justify-center mt-2">
                    <button
                        disabled={isLoading}
                        type="submit"
                        className="flex items-center justify-center text-white rounded-full px-[18px] py-[12px] bg-grayscale-900 text-2xl w-full shadow-lg"
                    >
                        {isLoading ? 'Saving...' : 'Save'}
                    </button>
                </IonRow>
            </form>
        </>
    );
};

export default UserProfileUpdateForm;
