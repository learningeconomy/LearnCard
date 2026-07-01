import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { auth } from '../../firebase/firebase';
import { updateProfile } from 'firebase/auth';
import { z } from 'zod';
import { Capacitor } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';
import moment from 'moment';
import DatePickerInput from '../date-picker/DatePickerInput';

import { getLogger } from 'learn-card-base';
const log = getLogger('user-profile-update-form');

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

import { IonCol, IonRow, IonInput, IonSpinner, IonDatetime } from '@ionic/react';
import Pencil from '../svgs/Pencil';
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
import IssuerStatusCard from './IssuerStatusCard';
import countries from '../../constants/countries.json';

import { useFilestack, UploadRes } from 'learn-card-base';

import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';

import { getAuthToken } from 'learn-card-base/helpers/authHelpers';
import { calculateAge } from 'learn-card-base/helpers/dateHelpers';
import { JoinNetworkModalWrapper } from '../network-prompts/hooks/useJoinLCNetworkModal';
import { LearnCardRoles, LearnCardRolesEnum } from '../onboarding/onboarding.helpers';
import { useGetAiInsightsServicesContract } from '../../pages/ai-insights/learner-insights/learner-insights.helpers';

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

const ChildDobValidator = z.object({
    dob: z.string().optional(),
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
    const brandingConfig = useBrandingConfig();
    const { isDesktop, isMobile } = useDeviceTypeByWidth();

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
    const { getAiInsightsContractUri } = useGetAiInsightsServicesContract(walletDid, true);

    const onUpload = (data: UploadRes) => {
        setPhoto(data?.url);
        setUploadProgress(false);
    };

    const { handleFileSelect: handleImageSelect, isLoading: imageUploadLoading } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data) => onUpload(data),
        options: { onProgress: event => setUploadProgress(event.totalPercent) },
    });

    const presentNetworkModal = () => {
        newModal(
            <JoinNetworkModalWrapper
                handleCloseModal={closeModal}
                showNotificationsModal={showNotificationsModal}
            />,
            { hideButton: true, sectionClassName: '!max-w-[400px]' },
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
        );
    };

    const validate = () => {
        let Schema;
        if (hasParentSwitchedProfile && lcNetworkProfile) {
            Schema = StateValidator.pick({ name: true }).merge(ChildDobValidator);
        } else {
            Schema = lcNetworkProfile ? StateValidator : StateValidator.pick({ name: true });
        }
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
            log.info('updatedProfile::res', updatedProfile);

            if (role === LearnCardRolesEnum.teacher) {
                getAiInsightsContractUri().catch(err => {
                    log.info('getAiInsightsContractUri::error', err);
                });
            }
        }
    };

    const presentUnderageModal = () => {
        newModal(
            <div className="flex flex-col gap-[12px] w-full max-w-[520px] h-full relative mx-auto">
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
                <div className="flex gap-3 w-full">
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
            // Skip age check for child accounts (hasParentSwitchedProfile)
            const age = dob ? calculateAge(dob) : Number.NaN;
            if (!hasParentSwitchedProfile && !Number.isNaN(age) && age < 13) {
                setErrors(prev => ({ ...prev, dob: [' You must be at least 13 years old.'] }));
                presentUnderageModal();
                return;
            }

            // Validate DOB even if name is not required per Apple guidelines
            const dobCheck = (
                hasParentSwitchedProfile ? ChildDobValidator : DobValidator
            ).safeParse({ dob });
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
            // Skip age check for child accounts (hasParentSwitchedProfile)
            if (lcNetworkProfile && !hasParentSwitchedProfile) {
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
                            presentNetworkModal();
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
                            presentNetworkModal();
                        }
                    }
                } catch (error) {
                    setIsLoading(false);
                    log.info('updateProfile::error', error);
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
            <IonRow class="w-full mb-6">
                <IonCol>
                    <p className="text-grayscale-900 font-poppins m-0 flex h-full w-full items-center justify-center text-center text-xl font-bold">
                        {title}
                    </p>
                </IonCol>
                <IonCol size="12" className="flex items-center justify-center mt-6">
                    <div className="relative flex items-center justify-center">
                        <ProfilePicture
                            customContainerClass="flex justify-center items-center h-[88px] w-[88px] rounded-full overflow-hidden border-4 border-white shadow-sm text-white font-medium text-xl min-w-[88px] min-h-[88px] bg-grayscale-100"
                            customImageClass="flex justify-center items-center h-[88px] w-[88px] rounded-full overflow-hidden object-cover min-w-[88px] min-h-[88px]"
                            customSize={500}
                            overrideSrc={photo?.length > 0}
                            overrideSrcURL={photo}
                        >
                            {imageUploadLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                                    <IonSpinner name="crescent" color="light" />
                                </div>
                            )}
                        </ProfilePicture>
                        <button
                            onClick={handleImageSelect}
                            type="button"
                            className="absolute bottom-0 right-0 text-grayscale-700 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-grayscale-200 hover:bg-grayscale-10 transition-colors"
                        >
                            <Pencil className="h-[14px] w-[14px]" />
                        </button>
                    </div>
                </IonCol>
            </IonRow>

            <div className="flex-grow flex items-center justify-center py-2">{children}</div>

            {!Capacitor.isNativePlatform() && (
                <div className="w-full px-6 mb-6">
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-grayscale-200 bg-grayscale-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-grayscale-900">
                                <HandshakeIcon className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-grayscale-900 font-poppins">
                                    Connect Handler
                                </span>
                                <span className="text-xs text-grayscale-500 font-poppins">
                                    Enable CHAPI integration
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleChapiInfo()}
                                className="p-2 text-grayscale-500 hover:text-grayscale-900 transition-colors"
                            >
                                <InfoIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={installChapi}
                                className="px-4 py-2 bg-grayscale-900 text-white text-sm font-medium rounded-[20px] hover:opacity-90 transition-opacity font-poppins"
                            >
                                Connect
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full px-6 mt-4">
                <IssuerStatusCard walletDid={walletDid} />
            </div>

            <form
                onSubmit={e => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleUpdateUser();
                }}
                className="flex flex-col items-center justify-center w-full px-6 mt-6 space-y-5"
            >
                <div className="flex flex-col items-center justify-center w-full space-y-5">
                    {profileLoading && (
                        <BoostTextSkeleton
                            containerClassName="w-full min-h-[52px] h-[52px] rounded-xl"
                            skeletonStyles={{ width: '100%', height: '100%', borderRadius: '12px' }}
                        />
                    )}
                    {lcNetworkProfile &&
                        lcNetworkProfile?.profileId &&
                        !profileLoading &&
                        !hasParentSwitchedProfile && (
                            <div className="flex flex-col w-full">
                                <label className="text-xs font-medium text-grayscale-700 mb-1.5 font-poppins">
                                    User ID
                                </label>
                                <input
                                    className="w-full py-3 px-4 bg-grayscale-100 text-grayscale-500 rounded-xl text-sm font-poppins border border-transparent cursor-not-allowed focus:outline-none"
                                    value={`@${lcNetworkProfile?.profileId}`}
                                    type="text"
                                    disabled={true}
                                    readOnly
                                />
                            </div>
                        )}
                    <div className="flex flex-col w-full">
                        <label className="text-xs font-medium text-grayscale-700 mb-1.5 font-poppins">
                            Full Name
                        </label>
                        <input
                            className={`w-full py-3 px-4 bg-white text-grayscale-900 rounded-xl text-sm font-poppins border focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow ${
                                errors.name
                                    ? 'border-red-300 focus:ring-red-500'
                                    : 'border-grayscale-300'
                            }`}
                            onChange={e => setName(e.target.value)}
                            value={name || ''}
                            placeholder="Enter your full name"
                            type="text"
                        />
                        {errors.name && (
                            <p className="text-xs text-red-600 mt-1.5 font-poppins">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {lcNetworkProfile && (
                        <>
                            <div className="flex flex-col w-full">
                                <label className="text-xs font-medium text-grayscale-700 mb-1.5 font-poppins">
                                    Date of Birth {hasParentSwitchedProfile ? '(disabled)' : ''}
                                </label>
                                <DatePickerInput
                                    value={dob || ''}
                                    onChange={(newDob: string) => {
                                        setErrors(prev => ({ ...prev, dob: undefined }));
                                        setDob(newDob);
                                    }}
                                    error={errors?.dob?.[0]}
                                    isMobile={!isDesktop}
                                    label="Select date"
                                    disabled={hasParentSwitchedProfile}
                                />

                                {dob && !Number.isNaN(calculateAge(dob)) && (
                                    <p className="text-xs text-grayscale-500 mt-1.5 font-poppins">
                                        Age: {calculateAge(dob)}
                                    </p>
                                )}

                                {errors?.dob && (
                                    <p className="text-xs text-red-600 mt-1.5 font-poppins">
                                        {errors?.dob}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col w-full">
                                <label className="text-xs font-medium text-grayscale-700 mb-1.5 font-poppins">
                                    Country
                                </label>
                                <button
                                    type="button"
                                    className="w-full flex items-center justify-between bg-white border border-grayscale-300 text-grayscale-900 rounded-xl font-poppins px-4 py-3 text-sm hover:bg-grayscale-10 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                                        <span className="flex items-center gap-2.5">
                                            <img
                                                src={`https://flagcdn.com/36x27/${country.toLowerCase()}.png`}
                                                alt={`${
                                                    (countries as Record<string, string>)[country]
                                                } flag`}
                                                className="w-6 h-[18px] object-cover rounded-sm shadow-sm"
                                            />
                                            {(countries as Record<string, string>)[country]}
                                        </span>
                                    ) : (
                                        <span className="text-grayscale-400">Select a country</span>
                                    )}
                                </button>
                            </div>

                            <div className="flex flex-col w-full">
                                <label className="text-xs font-medium text-grayscale-700 mb-1.5 font-poppins">
                                    Role
                                </label>
                                <OnboardingRoleItem
                                    role={role}
                                    roleItem={LearnCardRoles?.find(r => r.type === role) ?? null}
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
                        <div className="flex flex-col w-full">
                            <label className="text-xs font-medium text-grayscale-700 mb-1.5 font-poppins">
                                {brandingConfig.name} Number (DID)
                            </label>
                            <div className="flex items-center justify-between w-full bg-grayscale-100 rounded-xl px-4 py-3 border border-transparent">
                                <p className="text-grayscale-900 text-sm font-poppins truncate mr-4">
                                    {walletDid}
                                </p>
                                <button
                                    type="button"
                                    onClick={copyToClipBoard}
                                    className="flex-shrink-0 text-grayscale-500 hover:text-grayscale-900 transition-colors"
                                >
                                    <CopyStack className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                    {email && !hasParentSwitchedProfile && (
                        <div className="flex flex-col w-full">
                            <label className="text-xs font-medium text-grayscale-700 mb-1.5 font-poppins">
                                Email Address
                            </label>
                            <input
                                className="w-full py-3 px-4 bg-grayscale-100 text-grayscale-500 rounded-xl text-sm font-poppins border border-transparent cursor-not-allowed focus:outline-none"
                                value={email}
                                type="email"
                                disabled={true}
                                readOnly
                            />
                        </div>
                    )}
                    {phone && (
                        <div className="flex flex-col w-full">
                            <label className="text-xs font-medium text-grayscale-700 mb-1.5 font-poppins">
                                Phone Number
                            </label>
                            <input
                                className="w-full py-3 px-4 bg-grayscale-100 text-grayscale-500 rounded-xl text-sm font-poppins border border-transparent cursor-not-allowed focus:outline-none"
                                value={phone}
                                type="tel"
                                disabled={true}
                                readOnly
                            />
                        </div>
                    )}
                </div>

                <div className="pt-4 space-y-3 w-full">
                    <button
                        type="button"
                        onClick={e =>
                            newModal(<ExportSeedPhraseModal />, {
                                sectionClassName: '!max-w-[450px]',
                            })
                        }
                        className="w-full py-3 px-4 bg-white border border-grayscale-300 text-grayscale-700 rounded-[20px] font-poppins text-sm font-medium hover:bg-grayscale-10 transition-colors flex items-center justify-center"
                    >
                        Export Seed Phrase
                    </button>
                    {showDeleteAccountButton && !hasParentSwitchedProfile && (
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
                            className="w-full py-3 px-4 bg-red-50 border border-red-100 text-red-600 rounded-[20px] font-poppins text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <TrashBin className="w-5 h-5" />
                            Delete Account
                        </button>
                    )}
                </div>
            </form>
            {(() => {
                const footerButtons = (
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={handleCloseModal}
                            className="flex-1 py-3 px-4 bg-white border border-grayscale-300 text-grayscale-700 rounded-[20px] font-poppins text-sm font-medium hover:bg-grayscale-10 transition-colors"
                        >
                            Close
                        </button>
                        <button
                            disabled={isLoading}
                            onClick={handleSubmit}
                            className="flex-1 py-3 px-4 bg-grayscale-900 text-white rounded-[20px] font-poppins text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                );

                return sectionPortal ? (
                    createPortal(
                        <div
                            className={`flex justify-center items-center relative max-w-[500px] w-full px-6 ${
                                isMobile ? 'min-h-[100px]' : 'h-full'
                            }`}
                            style={{
                                bottom: `${bottomPosition}px`,
                            }}
                        >
                            {footerButtons}
                        </div>,
                        sectionPortal
                    )
                ) : (
                    <div className="w-full max-w-[500px] mx-auto flex justify-center items-center px-6 mt-8 mb-4">
                        {footerButtons}
                    </div>
                );
            })()}
        </>
    );
};

export default UserProfileUpdateForm;
