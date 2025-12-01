import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { auth } from '../../firebase/firebase';
import { updateProfile } from 'firebase/auth';
import { z } from 'zod';
import { Capacitor } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';
import moment from 'moment';

import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { useSafeArea } from 'learn-card-base/hooks/useSafeArea';
import { ToastTypeEnum, useToast } from 'learn-card-base/hooks/useToast';
import {
    SocialLoginTypes,
    authStore,
    currentUserStore,
    useSQLiteStorage,
    useWallet,
    getNotificationsEndpoint,
    useGetProfile,
    switchedProfileStore,
    useModal,
    ModalTypes,
    useDeviceTypeByWidth,
} from 'learn-card-base';

import { IonCol, IonRow, useIonModal, IonInput, IonSpinner, IonDatetime } from '@ionic/react';
import Pencil from '../svgs/Pencil';
import Calendar from '../svgs/Calendar';
import TrashBin from '../svgs/TrashBin';
import InfoIcon from '../svgs/InfoIcon';
import CopyStack from '../svgs/CopyStack';
import HandshakeIcon from '../svgs/HandshakeIcon';
import ExclamationPoint from '../svgs/ExclamationPoint';
import { ProfilePicture } from 'learn-card-base/components/profilePicture/ProfilePicture';
import DeleteUserConfirmationPrompt from '../userOptions/DeleteUserConfirmationPrompt';
import ExportSeedPhraseModal from '../userOptions/ExportSeedPhraseModal';
import BoostTextSkeleton from 'learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons';
import OnboardingRoleItem from '../onboarding/onboardingRoles/OnboardingRoleItem';
import OnboardingRolesContainer from '../onboarding/onboardingRoles/OnboardingRolesContainer';
import CountrySelectorModal from '../onboarding/onboardingNetworkForm/components/CountrySelectorModal';
import countries from '../../constants/countries.json';

import { useFilestack, UploadRes } from 'learn-card-base';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';

import { getAuthToken } from 'learn-card-base/helpers/authHelpers';
import { calculateAge } from 'learn-card-base/helpers/dateHelpers';
import { JoinNetworkModalWrapper } from '../network-prompts/hooks/useJoinLCNetworkModal';
import {
    LearnCardRoles,
    LearnCardRolesEnum,
    LearnCardRoleType,
} from '../onboarding/onboarding.helpers';

const StateValidator = z.object({
    name: z
        .string()
        .nonempty(' Name is required.')
        .min(3, ' Must contain at least 3 character(s).')
        .max(30, ' Must contain at most 30 character(s).')
        .regex(/^[A-Za-z0-9 ]+$/, ' Alpha numeric characters(s) only'),
    dob: z
        .string()
        .nonempty(' Date of birth is required.')
        .refine(dob => !Number.isNaN(calculateAge(dob)) && calculateAge(dob) >= 13, {
            message: ' You must be at least 13 years old.',
        }),
});

const DobValidator = StateValidator.pick({ dob: true });

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
    title = 'My Account',
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
    const { presentToast } = useToast();
    const sectionPortal = document.getElementById('section-cancel-portal');
    const safeArea = useSafeArea();
    const { isMobile } = useDeviceTypeByWidth();

    const [name, setName] = useState<string | null | undefined>(currentUser?.name ?? '');
    const [photo, setPhoto] = useState<string | null | undefined>(currentUser?.profileImage ?? '');
    const [email, setEmail] = useState<string | null | undefined>(currentUser?.email ?? '');
    const [phone, setPhone] = useState<string | null | undefined>(currentUser?.phoneNumber ?? '');
    const [role, setRole] = useState<LearnCardRolesEnum | null>(null);
    const [walletDid, setWalletDid] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    const [uploadProgress, setUploadProgress] = useState<number | false>(false);

    const { data: lcNetworkProfile, isLoading: profileLoading } = useGetProfile();

    const [dob, setDob] = useState<string | null | undefined>(lcNetworkProfile?.dob ?? '');
    const [country, setCountry] = useState<string | undefined>(lcNetworkProfile?.country ?? '');

    const hasParentSwitchedProfile = switchedProfileStore.get.isSwitchedProfile();

    useEffect(() => {
        const getWalletDid = async () => {
            const wallet = await initWallet();
            setWalletDid(wallet?.id?.did());
        };

        if (!walletDid) {
            getWalletDid();
        }

        if (lcNetworkProfile?.dob) {
            setDob(lcNetworkProfile?.dob);
        }

        if (lcNetworkProfile?.role) {
            setRole(lcNetworkProfile?.role as LearnCardRolesEnum);
        }

        if (lcNetworkProfile?.country) {
            setCountry(lcNetworkProfile?.country);
        }
    }, [walletDid, lcNetworkProfile]);

    const onUpload = (data: UploadRes) => {
        setPhoto(data?.url);
        setUploadProgress(false);
    };

    const { handleFileSelect: handleImageSelect, isLoading: imageUploadLoading } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data) => onUpload(data),
        options: { onProgress: event => setUploadProgress(event.totalPercent) },
    });

    const [presentNetworkModal, dismissNetworkModal] = useIonModal(JoinNetworkModalWrapper, {
        handleCloseModal: () => dismissNetworkModal(),
        showNotificationsModal: showNotificationsModal,
    });

    const validate = () => {
        const Schema = lcNetworkProfile ? StateValidator : StateValidator.pick({ name: true });
        const parsedData = Schema.safeParse(
            lcNetworkProfile
                ? {
                      name: name,
                      dob: dob,
                  }
                : {
                      name: name,
                  }
        );

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
        // prevent updating the sqlite store when in child mode
        if (!hasParentSwitchedProfile) {
            await updateCurrentUser(currentUser?.privateKey, {
                name: name ?? currentUser?.name ?? '',
                profileImage: photo ?? currentUser?.profileImage ?? '',
            });
        }

        currentUserStore.set.currentUser({
            ...currentUser,
            name: name ?? currentUser?.name ?? '',
            profileImage: photo ?? currentUser?.profileImage ?? '',
        });
    };

    const handleLCNetworkProfileUpdate = async () => {
        const wallet = await initWallet();

        if (lcNetworkProfile && lcNetworkProfile?.profileId) {
            const updatedProfile = await wallet?.invoke?.updateProfile({
                displayName: name ?? '',
                image: photo ?? '',
                notificationsWebhook: getNotificationsEndpoint(),
                dob: dob ?? '',
                role: role ?? '',
                country: country ?? '',
            });
            console.log('updatedProfile::res', updatedProfile);
        }
    };

    const presentUnderageModal = () => {
        newModal(
            <div className="flex flex-col gap-[12px] w-full max-w-[520px] h-full">
                <div className="w-full bg-white rounded-[24px] px-[20px] py-[28px] shadow-3xl text-center">
                    <div className="mx-auto mb-4 h-[56px] w-[56px] rounded-full border border-indigo-200 flex items-center justify-center">
                        <div className="flex items-center justify-center h-[28px] w-[28px] text-indigo-600">
                            <ExclamationPoint className="h-full w-full" />
                        </div>
                    </div>
                    <h2 className="text-[22px] font-bold text-grayscale-900 mb-2 font-poppins">
                        Get an Adult
                    </h2>
                    <p className="text-grayscale-700 text-[17px] leading-[24px] px-[10px]">
                        You'll need a parent or guardian to set up a Family Account before you can
                        join.
                    </p>
                </div>
                <div className="flex gap-3 w-full absolute bottom-0">
                    <button
                        type="button"
                        onClick={closeModal}
                        className="flex-1 py-[10px] text-[20px] bg-white rounded-[40px] text-grayscale-900 shadow-box-bottom border border-grayscale-200"
                    >
                        Back
                    </button>
                    <button
                        type="button"
                        onClick={closeModal}
                        className="flex-1 py-[10px] text-[20px] bg-emerald-700 rounded-[40px] text-white shadow-box-bottom"
                    >
                        I'm an Adult
                    </button>
                </div>
            </div>,
            {
                sectionClassName:
                    '!bg-transparent !border-none !shadow-none !rounded-none !max-w-[600px] !mx-auto',
            },
            {
                desktop: ModalTypes.Center,
                mobile: ModalTypes.Center,
            }
        );
    };

    const handleUpdateUser = async () => {
        const typeOfLogin = authStore.get.typeOfLogin();

        // ! APPLE HOT FIX
        if (typeOfLogin === SocialLoginTypes.apple) {
            // Show modal if under 13 before running Zod, to ensure UX triggers
            const age = dob ? calculateAge(dob) : Number.NaN;
            if (!Number.isNaN(age) && age < 13) {
                setErrors(prev => ({ ...prev, dob: [' You must be at least 13 years old.'] }));
                presentUnderageModal();
                return;
            }

            // Validate DOB even if name is not required per Apple guidelines
            const dobCheck = DobValidator.safeParse({ dob });
            if (!dobCheck.success) {
                setErrors(dobCheck.error.flatten().fieldErrors);
                return;
            }
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
            // If LCN profile exists, show modal when age < 13 regardless of Zod
            if (lcNetworkProfile) {
                const age = dob ? calculateAge(dob) : Number.NaN;
                if (!Number.isNaN(age) && age < 13) {
                    setErrors(prev => ({ ...prev, dob: [' You must be at least 13 years old.'] }));
                    presentUnderageModal();
                    return;
                }
            }

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
                        // prevent updating the firebase account when in child mode
                        if (!hasParentSwitchedProfile) {
                            // update firebase profile
                            await updateProfile(auth()?.currentUser, {
                                displayName: name,
                                photoURL: photo,
                            });
                        }

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
            presentToast('DID copied to clipboard', {
                hasDismissButton: true,
            });
        } catch (err) {
            presentToast('Unable to copy DID to clipboard', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const handleSubmit = (e: React.FormEvent | React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        handleUpdateUser();
    };

    let bottomPosition = safeArea.bottom;
    if (Capacitor.isNativePlatform()) bottomPosition = safeArea.bottom > 0 ? safeArea.bottom : 20;

    return (
        <>
            <IonRow class="w-full">
                <IonCol>
                    <p className="text-grayscale-900 font-poppins m-0 flex h-full w-full items-center justify-center text-center text-xl font-bold">
                        {title}
                    </p>
                </IonCol>
                <IonCol size="12" className="flex items-center justify-center">
                    <div className="bg-grayscale-100/40 relative m-0 flex items-center justify-between rounded-[40px] object-fill p-0 pb-[3px] pr-[10px] pt-[3px]">
                        <ProfilePicture
                            customContainerClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-xl min-w-[70px] min-h-[70px]"
                            customImageClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[70px] min-h-[70px]"
                            customSize={500}
                            overrideSrc={photo?.length > 0}
                            overrideSrcURL={photo}
                        >
                            {imageUploadLoading && (
                                <div className="user-image-upload-inprogress absolute flex h-[70px] min-h-[70px] w-[70px] min-w-[70px] items-center justify-center overflow-hidden rounded-full border-2 border-solid border-white text-xl font-medium text-white">
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

            <div className="flex-grow flex items-center justify-center py-2">{children}</div>

            {!Capacitor.isNativePlatform() && (
                <div className="w-full flex items-center justify-between px-6">
                    <button
                        onClick={installChapi}
                        className="flex items-center justify-center text-white rounded-full px-[18px] py-[12px] bg-grayscale-900 font-poppins text-xl w-[85%] shadow-lg"
                    >
                        <HandshakeIcon className="mr-2" /> Connect Handler
                    </button>
                    <button
                        onClick={() => handleChapiInfo()}
                        className="flex items-center justify-center text-grayscale-900 text-xl"
                    >
                        <InfoIcon />
                    </button>
                </div>
            )}

            <form
                onSubmit={e => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleUpdateUser();
                }}
                className="flex flex-col items-center justify-center w-full px-6 mt-4"
            >
                <IonRow className="flex flex-col items-center justify-center w-full">
                    {profileLoading && (
                        <BoostTextSkeleton
                            containerClassName="w-full min-h-[52px] h-[52px] rounded-[15px] mb-4"
                            skeletonStyles={{ width: '100%', height: '100%', borderRadius: '15px' }}
                        />
                    )}
                    {lcNetworkProfile &&
                        lcNetworkProfile?.profileId &&
                        !profileLoading &&
                        !hasParentSwitchedProfile && (
                            <IonInput
                                autocapitalize="on"
                                className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base mb-4 !opacity-70`}
                                value={`@${lcNetworkProfile?.profileId}`}
                                placeholder="User ID"
                                type="text"
                                disabled={true}
                            />
                        )}
                    <div className="flex flex-col items-center justify-center w-full mb-2">
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

                    {lcNetworkProfile && (
                        <>
                            <div className="flex flex-col items-center justify-center w-full mb-2 mt-2">
                                <button
                                    type="button"
                                    className={`w-full flex items-center justify-between bg-grayscale-100 text-grayscale-500 rounded-[15px] font-poppins font-normal px-[16px] py-[16px] tracking-wider text-base ${
                                        errors?.dob ? 'login-input-email-error' : ''
                                    }`}
                                    onClick={e => {
                                        e.preventDefault();
                                        newModal(
                                            <div className="w-full h-full transparent flex items-center justify-center">
                                                <IonDatetime
                                                    onIonChange={e => {
                                                        setErrors({});
                                                        setDob(
                                                            moment(e.detail.value).format(
                                                                'YYYY-MM-DD'
                                                            )
                                                        );
                                                        closeModal();
                                                    }}
                                                    value={
                                                        dob
                                                            ? moment(dob).format('YYYY-MM-DD')
                                                            : null
                                                    }
                                                    id="datetime"
                                                    presentation="date"
                                                    className="bg-white text-black rounded-[20px] w-full shadow-3xl z-50 font-notoSans"
                                                    showDefaultButtons
                                                    color="indigo-500"
                                                    max={moment().format('YYYY-MM-DD')}
                                                    min="1900-01-01"
                                                    onIonCancel={closeModal}
                                                />
                                            </div>,
                                            {
                                                disableCloseHandlers: true,
                                                sectionClassName:
                                                    '!bg-transparent !border-none !shadow-none !rounded-none',
                                            },
                                            {
                                                desktop: ModalTypes.Center,
                                                mobile: ModalTypes.Center,
                                            }
                                        );
                                    }}
                                >
                                    {dob ? moment(dob).format('MMMM Do, YYYY') : 'Date of Birth'}
                                    <Calendar className="w-[30px] text-grayscale-700" />
                                </button>

                                {dob && !Number.isNaN(calculateAge(dob)) && (
                                    <p className="p-0 m-0 w-full text-left mt-1 text-grayscale-700 text-xs">
                                        Age: {calculateAge(dob)}
                                    </p>
                                )}

                                {errors?.dob && (
                                    <p className="p-0 m-0 w-full text-left mt-1 text-red-600 text-xs">
                                        {errors?.dob}
                                    </p>
                                )}
                            </div>

                            {/* Country selector */}
                            <div className="flex flex-col items-center justify-center w-full mt-2">
                                <button
                                    type="button"
                                    className={`w-full flex items-center justify-between bg-grayscale-100 text-grayscale-500 rounded-[15px] font-poppins font-normal px-[16px] py-[16px] tracking-wider text-base`}
                                    onClick={e => {
                                        e.preventDefault();
                                        newModal(
                                            <CountrySelectorModal
                                                selected={country}
                                                onSelect={code => {
                                                    setCountry(code);
                                                    closeModal();
                                                }}
                                            />,
                                            {
                                                sectionClassName:
                                                    '!bg-transparent !border-none !shadow-none !rounded-none',
                                            },
                                            {
                                                desktop: ModalTypes.Center,
                                                mobile: ModalTypes.Center,
                                            }
                                        );
                                    }}
                                    aria-label="Country"
                                >
                                    {country ? (
                                        <span className="text-grayscale-700 text-[14px] flex items-center gap-[10px]">
                                            <img
                                                src={`https://flagcdn.com/36x27/${country.toLowerCase()}.png`}
                                                alt={`${
                                                    (countries as Record<string, string>)[country]
                                                } flag`}
                                                className="w-[36px] h-[27px] object-cover"
                                            />
                                            {(countries as Record<string, string>)[country]}
                                        </span>
                                    ) : (
                                        <span className="text-grayscale-500 text-[14px]">
                                            Country
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Role selector */}
                            <div className="w-full flex items-center justify-center my-2">
                                <OnboardingRoleItem
                                    role={role}
                                    roleItem={
                                        LearnCardRoles?.find(
                                            r => r.type === role
                                        ) as LearnCardRoleType
                                    }
                                    setRole={() => {}}
                                    handleEdit={() => {
                                        newModal(
                                            <OnboardingRolesContainer
                                                role={role}
                                                setRole={setRole}
                                            />,
                                            {
                                                sectionClassName:
                                                    '!max-w-[600px] !mx-auto !max-h-[90%]',
                                            },
                                            {
                                                mobile: ModalTypes.Center,
                                                desktop: ModalTypes.Center,
                                            }
                                        );
                                    }}
                                    showDescription={false}
                                />
                            </div>
                        </>
                    )}

                    {walletDid && (
                        <IonRow className="flex items-center justify-center w-full bg-grayscale-100 mb-4 rounded-[15px] mt-2">
                            <IonCol className="w-full flex items-center justify-between px-4 rounded-2xl">
                                <div className="w-[80%] flex flex-col justify-center items-start text-left">
                                    <p className="text-grayscale-500 font-medium text-sm">
                                        LearnCard Number (DID)
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
                    {email && !hasParentSwitchedProfile && (
                        <IonInput
                            autocapitalize="on"
                            className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base mb-4 !opacity-70`}
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
                            className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base mb-4 !opacity-70`}
                            onIonInput={e => setPhone(e.detail.value)}
                            value={phone}
                            placeholder="Phone Number"
                            type="tel"
                            disabled={true}
                        />
                    )}
                </IonRow>
                <button
                    type="button"
                    onClick={e =>
                        newModal(<ExportSeedPhraseModal />, { sectionClassName: '!max-w-[450px]' })
                    }
                    className="flex items-center justify-center bg-white rounded-full px-[18px] py-[12px] text-grayscale-900 font-poppins text-xl w-full shadow-lg normal mb-[10px]"
                >
                    Export Seed Phrase
                </button>
                {showDeleteAccountButton && !hasParentSwitchedProfile && (
                    <IonRow className="w-full flex items-center justify-center">
                        <button
                            type="button"
                            onClick={e => {
                                e.stopPropagation();
                                e.preventDefault();
                                newModal(
                                    <DeleteUserConfirmationPrompt
                                        handleCloseModal={() => closeModal()}
                                        showCloseButton={true}
                                        showFixedFooter={false}
                                        handleLogout={(
                                            e: React.MouseEvent<HTMLButtonElement, MouseEvent>
                                        ) => onLogout(e)}
                                    />
                                );
                            }}
                            className="flex items-center justify-center bg-white rounded-full px-[18px] py-[12px] text-grayscale-900 font-poppins text-xl w-full shadow-lg normal"
                        >
                            <TrashBin className="ml-[5px] h-[30px] w-[30px] mr-2" />
                            Delete Account
                        </button>
                    </IonRow>
                )}
            </form>
            {sectionPortal &&
                createPortal(
                    <div
                        className={`flex justify-center items-center relative max-w-[500px] !border-none ${
                            isMobile ? 'min-h-[120px]' : 'h-full'
                        }`}
                        style={{
                            bottom: `${bottomPosition}px`,
                        }}
                    >
                        <button
                            disabled={isLoading}
                            onClick={handleSubmit}
                            className="bg-grayscale-900 text-white text-[17px] py-1.5 rounded-[30px] font-poppins font-semibold w-full h-[50px] flex justify-center items-center shadow-[0px_2px_3px_rgba(0,0,0,0.25)] mr-[5px]"
                        >
                            {isLoading ? 'Saving...' : 'Save'}
                        </button>

                        <button
                            onClick={closeModal}
                            className="bg-white text-grayscale-800 text-[17px] font-poppins py-1.5 rounded-[30px] w-full h-[50px] shadow-[0px_4px_4px_rgba(0,0,0,0.25)]"
                        >
                            Close
                        </button>
                    </div>,
                    sectionPortal
                )}
        </>
    );
};

export default UserProfileUpdateForm;
