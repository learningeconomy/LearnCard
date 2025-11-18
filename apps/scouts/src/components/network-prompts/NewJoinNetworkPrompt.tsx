import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { auth } from '../../firebase/firebase';
import { updateProfile } from 'firebase/auth';
import { z } from 'zod';

import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import {
    SocialLoginTypes,
    authStore,
    currentUserStore,
    useSQLiteStorage,
    useWallet,
    getNotificationsEndpoint,
    BrandingEnum,
    useGetCurrentLCNUser,
    useIsCurrentUserLCNUser,
    useGetProfile,
    useModal,
} from 'learn-card-base';

import {
    IonCol,
    IonRow,
    IonInput,
    IonSpinner,
    useIonModal,
    IonPage,
    IonLoading,
} from '@ionic/react';
import { ProfilePicture } from 'learn-card-base/components/profilePicture/ProfilePicture';
import ModalLayout from '../../layout/ModalLayout';
import HeaderBranding from 'learn-card-base/components/headerBranding/HeaderBranding';

import { useFilestack, UploadRes } from 'learn-card-base';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';
import Pencil from '../svgs/Pencil';
import ErrorLogout from './ErrorLogout';
import { getAuthToken } from 'learn-card-base/helpers/authHelpers';
import { AddressBookContact } from '../../pages/addressBook/addressBookHelpers';
import { openPP, openToS } from '../../helpers/externalLinkHelpers';

const StateValidator = z.object({
    name: z
        .string()
        .nonempty(' Name is required.')
        .min(3, ' Must contain at least 3 character(s).')
        .max(30, ' Must contain at most 30 character(s).')
        .regex(/^[A-Za-z0-9 ]+$/, ' Alpha numeric characters(s) only'),
});

const ProfileIDStateValidator = z.object({
    profileId: z
        .string()
        .nonempty(' User ID is required.')
        .min(3, ' Must contain at least 3 character(s).')
        .max(25, ' Must contain at most 25 character(s).')
        .regex(
            /^[a-zA-Z0-9-]+$/,
            ` Alpha numeric characters(s) and dashes '-' only, no spaces allowed.`
        ),
});

type NewJoinNetworkPromptProps = {
    title?: string;
    handleCloseModal: () => void;
    handleLogout?: () => void;
    showCancelButton?: boolean;
    showDeleteAccountButton?: boolean;
    showNetworkModal?: boolean;
    showNotificationsModal?: boolean;
    children?: any;
};

const NewJoinNetworkPrompt: React.FC<NewJoinNetworkPromptProps> = ({
    title = 'My Account',
    handleCloseModal,
    handleLogout,
    showCancelButton = true,
    showDeleteAccountButton = true,
    showNetworkModal = false,
    showNotificationsModal = true,
}) => {
    const { initWallet } = useWallet();
    // const { newModal } = useModal();
    const { refetch } = useGetCurrentLCNUser();
    const { refetch: refetchIsCurrentUserLCNUser } = useIsCurrentUserLCNUser();
    const queryClient = useQueryClient();

    const authToken = getAuthToken();
    const currentUser = useCurrentUser();
    const { updateCurrentUser } = useSQLiteStorage();

    const [name, setName] = useState<string | null | undefined>(currentUser?.name ?? '');
    const [photo, setPhoto] = useState<string | null | undefined>(currentUser?.profileImage ?? '');

    const [networkToggle, setNetworkToggle] = useState<boolean>(true);
    const [profileId, setProfileId] = useState<string | null | undefined>('');

    const [walletDid, setWalletDid] = useState<string>('');

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [createLoading, setIsCreateLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [profileIdErrors, setProfileIdErrors] = useState<Record<string, string[]>>({});

    const [uploadProgress, setUploadProgress] = useState<number | false>(false);

    const { data: lcNetworkProfile, isLoading: profileLoading } = useGetProfile();

    const [presentLogoutErrorModal] = useIonModal(<ErrorLogout />);

    // const presentLogoutErrorModal = () => {
    //     newModal(<ErrorLogout />, { sectionClassName: '!max-w-[400px]' });
    // };

    useEffect(() => {
        const getWalletDid = async () => {
            const wallet = await initWallet();
            setWalletDid(wallet?.id?.did());
        };

        if (!walletDid) {
            getWalletDid();
        }
    }, [walletDid]);

    const onUpload = (data: UploadRes) => {
        setPhoto(data?.url);
        setUploadProgress(false);
    };

    const { handleFileSelect: handleImageSelect, isLoading: imageUploadLoading } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data) => onUpload(data),
        options: { onProgress: event => setUploadProgress(event.totalPercent) },
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

    const validateProfileID = () => {
        const parsedData = ProfileIDStateValidator.safeParse({
            profileId: profileId,
        });

        if (parsedData.success) {
            setProfileIdErrors({});
            return true;
        }

        if (parsedData.error) {
            setProfileIdErrors(parsedData.error.flatten().fieldErrors);
        }

        return false;
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

    const handleJoinLearnCardNetwork = async () => {
        if (validateProfileID()) {
            try {
                setIsLoading(true);
                setIsCreateLoading(true);
                const wallet = await initWallet();
                const didWeb = await wallet.invoke.createProfile({
                    did: wallet.id.did(),
                    profileId: profileId,
                    displayName: name,
                    image: photo,
                    notificationsWebhook: getNotificationsEndpoint(),
                });

                if (didWeb) {
                    await refetchIsCurrentUserLCNUser();
                    await wallet.invoke.resetLCAClient();
                    await queryClient.resetQueries();
                    await refetch(); // refetch to sync -> useGetCurrentLCNUser hook
                    handleCloseModal();
                    setIsLoading(false);
                    setIsCreateLoading(false);
                }
            } catch (err) {
                console.log('createProfile::error', err);
                setError(err?.toString?.());
                setIsLoading(false);
                setIsCreateLoading(false);
            }
        }
    };

    const handleLCNetworkProfileUpdate = async () => {
        const wallet = await initWallet();

        if (lcNetworkProfile && lcNetworkProfile?.profileId) {
            const updatedProfile = await wallet?.invoke?.updateProfile({
                displayName: name,
                image: photo,
                notificationsWebhook: getNotificationsEndpoint(),
            });
        } else {
            handleJoinLearnCardNetwork();
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
                        // handleCloseModal();
                    } else {
                        if (typeOfLogin === SocialLoginTypes.scoutsSSO) {
                            // ! skip updating a user's profile if the user logged
                            // ! in using scouts single-sign-on
                        } else {
                            // update firebase profile
                            try {
                                await updateProfile(auth()?.currentUser, {
                                    displayName: name,
                                    photoURL: photo,
                                });
                            } catch (e) {
                                presentLogoutErrorModal();
                                setError(`There was a firebase error: ${e?.toString?.()}`);
                            }
                        }

                        // update LC network profile
                        await handleLCNetworkProfileUpdate();

                        // update sqlite + context store
                        handleStorageUpdate();

                        setIsLoading(false);
                        // handleCloseModal();
                    }
                } catch (error) {
                    setIsLoading(false);
                    console.log('updateProfile::error', error);
                }
            }
        }
    };

    const handleClick = () => {
        if (!isLoading) {
            handleUpdateUser();
        }
    };

    return (
        <IonPage>
            <ModalLayout handleOnClick={handleCloseModal} buttonText="Skip For Now" allowScroll>
                <IonLoading mode="ios" message="Joining Network..." isOpen={createLoading} />

                <IonRow class="w-full">
                    <IonRow className="flex w-full flex-col items-center justify-center mb-2">
                        <div className="flex w-full items-center justify-center">
                            <h6
                                className={`font-notoSans select-none text-xl font-medium tracking-wider text-center`}
                            >
                                <span className="font-notoSans font-normal text-center">
                                    Welcome to
                                </span>
                                <br />
                                <h6 className="tracking-[12px] text-lg font-bold text-black">
                                    SCOUTPASS
                                </h6>
                            </h6>
                        </div>
                        <div className="flex w-full items-center justify-center text-center">
                            <h1 className="text-center text-base mt-2 font-normal text-black">
                                Set up your profile to get started!
                            </h1>
                        </div>
                    </IonRow>
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

                <div className="flex flex-col items-center justify-center w-full px-6 mt-4">
                    {/* profile setup */}
                    <IonRow className="flex flex-col items-center justify-center w-full">
                        {lcNetworkProfile && lcNetworkProfile?.profileId && (
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
                            <p className="text-grayscale-600  text-[13px] w-full text-left font-notoSans mt-2">
                                <strong>Full Name</strong>
                            </p>
                            <IonInput
                                autocapitalize="on"
                                className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium text-base ${
                                    errors.name ? 'login-input-email-error' : ''
                                }`}
                                onIonInput={e => {
                                    setName(e.detail.value);
                                }}
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
                    </IonRow>

                    {/* network setup */}
                    <IonRow className="w-full flex flex-col items-center justify-center">
                        <div className="w-full flex items-center justify-between">
                            <p className="text-grayscale-900 text-base font-medium w-10/12 text-left pr-2 font-notoSans">
                                Join the ScoutPass Network
                            </p>
                        </div>
                        {networkToggle && (
                            <>
                                <p className="text-grayscale-600 font-normal text-[13px] w-full text-left font-notoSans mt-2">
                                    The ScoutPass Network allows you to exchange credentials and
                                    badges with other members.
                                    {/* disable editing access settings till supported */}
                                    {/* <span className="font-bold text-indigo-500">Edit Access</span> */}
                                </p>
                                <p className="text-grayscale-600  text-[13px] w-full text-left font-notoSans mt-2">
                                    <strong>Create a new username</strong>
                                </p>
                            </>
                        )}
                    </IonRow>

                    {/* opting into network */}
                    {networkToggle && (
                        <IonRow className="flex flex-col items-center justify-center w-full mt-1">
                            <div className="flex flex-col items-center justify-center w-full mb-4">
                                <div className="flex w-full items-center">
                                    <p className="font-medium mr-[5px] text-grayscale-600 text-[20px]">
                                        @
                                    </p>
                                    <IonInput
                                        autocapitalize="on"
                                        className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium text-base text-left ${
                                            error || errors?.profileId
                                                ? 'login-input-email-error'
                                                : ''
                                        }`}
                                        onIonInput={e => {
                                            setProfileId(e.detail.value);
                                            if (error) {
                                                setError('');
                                            }
                                        }}
                                        value={profileId}
                                        placeholder="username"
                                        type="text"
                                    />
                                </div>
                                {error && (
                                    <p className="p-0 m-0 w-full text-left mt-1 text-red-600">
                                        {error}
                                    </p>
                                )}
                                {profileIdErrors?.profileId && (
                                    <p className="p-0 m-0 w-full text-left mt-1 text-red-600">
                                        {profileIdErrors?.profileId}
                                    </p>
                                )}
                            </div>
                        </IonRow>
                    )}

                    {/* opting out of network */}
                    {!networkToggle && (
                        <IonRow className="w-full flex flex-col items-center justify-center mt-4">
                            <p className="text-grayscale-900 font-normal text-base w-full text-left font-notoSans">
                                You can still use ScoutPass without joining the network.
                            </p>
                            <p className="text-grayscale-600 font-normal text-[14px] w-full text-left font-notoSans mt-2">
                                You won't be able to send Boosts or connect with others, but you can
                                still sync credentials. You can join later anytime.
                            </p>
                        </IonRow>
                    )}

                    <IonRow className="w-full flex items-center justify-center mt-8">
                        <button
                            onClick={handleClick}
                            type="button"
                            className="flex items-center justify-center text-white rounded-full px-[18px] py-[12px] bg-sp-purple-base text-2xl w-full shadow-lg"
                        >
                            {isLoading ? 'Loading...' : "Let's Go!"}
                        </button>
                    </IonRow>
                </div>

                <IonRow className="flex items-center justify-center mt-4 w-full">
                    <IonCol className="flex flex-col items-center justify-center text-center">
                        <p className="text-center text-sm font-normal px-16 text-grayscale-600">
                            You own your own data.
                            <br />
                            All connections are encrypted.
                        </p>
                        <button className="text-indigo-500 font-bold">Learn More</button>
                    </IonCol>
                </IonRow>

                <IonRow className="flex items-center justify-center w-full">
                    <IonCol className="flex items-center justify-center">
                        <button onClick={openPP} className="text-indigo-500 font-bold text-sm">
                            Privacy Policy
                        </button>
                        <span className="text-indigo-500 font-bold text-sm">&nbsp;•&nbsp;</span>
                        <button onClick={openToS} className="text-indigo-500 font-bold text-sm">
                            Terms of Service
                        </button>
                    </IonCol>
                </IonRow>
            </ModalLayout>
        </IonPage>
    );
};

export default NewJoinNetworkPrompt;
