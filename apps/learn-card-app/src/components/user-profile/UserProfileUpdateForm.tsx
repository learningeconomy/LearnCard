import React, { useState, useEffect } from 'react';
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

import { IonSpinner } from '@ionic/react';
import Pencil from '../svgs/Pencil';
import TrashBin from '../svgs/TrashBin';
import InfoIcon from '../svgs/InfoIcon';
import CopyStack from '../svgs/CopyStack';
import HandshakeIcon from '../svgs/HandshakeIcon';
import ExclamationPoint from '../svgs/ExclamationPoint';
import { ProfilePicture } from 'learn-card-base/components/profilePicture/ProfilePicture';
import DeleteUserConfirmationPrompt from '../userOptions/DeleteUserConfirmationPrompt';
import ExportSeedPhraseModal from '../userOptions/ExportSeedPhraseModal';
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

import { Bell } from 'lucide-react';
import GlassCard from '../../pages/privacy-settings/components/GlassCard';
import TextInput from 'learn-card-base/components/form-inputs/TextInput';
import { useTheme } from '../../theme/hooks/useTheme';

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
    onOpenNotifications?: () => void;
    showNotificationsRow?: boolean;
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
    onOpenNotifications,
    showNotificationsRow,
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
    const brandingConfig = useBrandingConfig();
    const { isDesktop } = useDeviceTypeByWidth();
    const { getColorSet } = useTheme();
    const primaryColor = getColorSet('defaults')?.primary || '#4f46e5';

    const [name, setName] = useState<string | null | undefined>(currentUser?.name ?? '');
    const [photo, setPhoto] = useState<string | null | undefined>(currentUser?.profileImage ?? '');
    const [email, setEmail] = useState<string | null | undefined>(currentUser?.email ?? '');
    const [phone, setPhone] = useState<string | null | undefined>(currentUser?.phoneNumber ?? '');
    const [role, setRole] = useState<LearnCardRolesEnum | null>(null);
    const [walletDid, setWalletDid] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    const [uploadProgress, setUploadProgress] = useState<number | false>(false);

    const { data: lcNetworkProfile } = useGetProfile();

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
            presentToast('Profile saved', { type: ToastTypeEnum.Success, hasDismissButton: true });
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
                        presentToast('Profile saved', {
                            type: ToastTypeEnum.Success,
                            hasDismissButton: true,
                        });
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
                        presentToast('Profile saved', {
                            type: ToastTypeEnum.Success,
                            hasDismissButton: true,
                        });
                        handleCloseModal();
                        if (showNetworkModal) {
                            presentNetworkModal();
                        }
                    }
                } catch (error) {
                    setIsLoading(false);
                    log.info('updateProfile::error', error);
                    presentToast('Could not save your profile. Please try again.', {
                        type: ToastTypeEnum.Error,
                        hasDismissButton: true,
                    });
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

    const handleConnectChapi = async () => {
        try {
            await installChapi();
            presentToast('Credential handler connected', {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (e) {
            log.info('installChapi::error', e);
            presentToast(
                'Couldn’t connect the credential handler. Your browser may have blocked it — check permissions and try again.',
                { type: ToastTypeEnum.Error, hasDismissButton: true }
            );
        }
    };

    const handleSubmit = (e: React.FormEvent | React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        handleUpdateUser();
    };

    return (
        <div className="h-full flex flex-col relative bg-grayscale-50/50">
            {/* Aurora Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-400/10 blur-[120px]" />
                <div className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-emerald-400/10 blur-[100px]" />
                <div className="absolute -bottom-[20%] left-[20%] w-[80%] h-[80%] rounded-full bg-rose-400/10 blur-[120px]" />
            </div>

            <div className="relative z-10 flex-1 overflow-y-auto safe-area-top-margin pb-6">
                {/* Identity Header */}
                <div className="flex flex-col items-center justify-center pt-8 pb-6 px-6">
                    <div className="relative mb-4">
                        <ProfilePicture
                            customContainerClass="flex justify-center items-center h-[100px] w-[100px] rounded-full overflow-hidden border-4 border-white shadow-lg text-white font-medium text-3xl min-w-[100px] min-h-[100px] bg-grayscale-100"
                            customImageClass="flex justify-center items-center h-[100px] w-[100px] rounded-full overflow-hidden object-cover border-4 border-white min-w-[100px] min-h-[100px]"
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
                            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-grayscale-100 text-grayscale-700 hover:bg-grayscale-50 transition-colors"
                        >
                            <Pencil className="h-4 w-4" />
                        </button>
                    </div>

                    <h2 className="text-2xl font-bold text-grayscale-900 font-poppins text-center mb-1">
                        {name || 'Your Name'}
                    </h2>
                    {lcNetworkProfile?.profileId && !hasParentSwitchedProfile && (
                        <p className="text-grayscale-500 font-medium text-[15px]">
                            @{lcNetworkProfile.profileId}
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-4 sm:px-6">
                    {/* PROFILE SECTION */}
                    <div className="flex flex-col gap-2">
                        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-grayscale-500 px-2">
                            Profile
                        </h3>
                        <GlassCard className="p-4 flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[14px] font-medium text-grayscale-700 px-1">
                                    Full Name
                                </label>
                                <TextInput
                                    value={name}
                                    onChange={setName}
                                    placeholder="Enter your full name"
                                    className={errors.name ? 'ring-1 ring-red-500' : ''}
                                />
                                {errors.name && (
                                    <p className="text-red-500 text-xs px-1">{errors.name}</p>
                                )}
                            </div>

                            {lcNetworkProfile && (
                                <>
                                    <div className="border-t border-grayscale-200/60" />
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[14px] font-medium text-grayscale-700 px-1">
                                            Date of Birth{' '}
                                            {hasParentSwitchedProfile ? '(disabled)' : ''}
                                        </label>
                                        <DatePickerInput
                                            value={dob || ''}
                                            onChange={(newDob: string) => {
                                                setErrors(prev => ({ ...prev, dob: undefined }));
                                                setDob(newDob);
                                            }}
                                            error={errors?.dob?.[0]}
                                            isMobile={!isDesktop}
                                            disabled={hasParentSwitchedProfile}
                                        />
                                        {dob && !Number.isNaN(calculateAge(dob)) && (
                                            <p className="text-grayscale-500 text-xs px-1">
                                                Age: {calculateAge(dob)}
                                            </p>
                                        )}
                                        {errors?.dob && (
                                            <p className="text-red-500 text-xs px-1">
                                                {errors.dob}
                                            </p>
                                        )}
                                    </div>

                                    <div className="border-t border-grayscale-200/60" />
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[14px] font-medium text-grayscale-700 px-1">
                                            Country
                                        </label>
                                        <button
                                            type="button"
                                            className="w-full flex items-center justify-between bg-grayscale-100/80 hover:bg-grayscale-100 transition-colors rounded-[10px] px-4 py-3 text-left"
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
                                        >
                                            {country ? (
                                                <span className="text-grayscale-900 text-[14px] flex items-center gap-3">
                                                    <img
                                                        src={`https://flagcdn.com/36x27/${country.toLowerCase()}.png`}
                                                        alt={`${
                                                            (countries as Record<string, string>)[
                                                                country
                                                            ]
                                                        } flag`}
                                                        className="w-[24px] h-[18px] object-cover rounded-sm shadow-sm"
                                                    />
                                                    {(countries as Record<string, string>)[country]}
                                                </span>
                                            ) : (
                                                <span className="text-grayscale-500 text-[14px]">
                                                    Select Country
                                                </span>
                                            )}
                                        </button>
                                    </div>

                                    <div className="border-t border-grayscale-200/60" />
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[14px] font-medium text-grayscale-700 px-1">
                                            Role
                                        </label>
                                        <div className="bg-grayscale-100/80 rounded-[10px] p-1">
                                            <OnboardingRoleItem
                                                role={role}
                                                roleItem={
                                                    LearnCardRoles?.find(r => r.type === role) ??
                                                    null
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
                                    </div>
                                </>
                            )}
                        </GlassCard>
                    </div>

                    {/* PREFERENCES SECTION */}
                    {showNotificationsRow && Capacitor.isNativePlatform() && (
                        <div className="flex flex-col gap-2">
                            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-grayscale-500 px-2">
                                Preferences
                            </h3>
                            <GlassCard className="flex flex-col">
                                <button
                                    type="button"
                                    onClick={() => onOpenNotifications?.()}
                                    className="flex items-center justify-between px-5 py-4 hover:bg-grayscale-50/50 transition-colors rounded-[20px]"
                                >
                                    <div className="flex items-center gap-3">
                                        <Bell className="w-5 h-5 text-grayscale-500" />
                                        <div className="flex flex-col items-start">
                                            <span className="text-[15px] font-medium text-grayscale-900">
                                                Notifications
                                            </span>
                                            <span className="text-sm text-grayscale-500">
                                                Manage push notifications
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-grayscale-400">
                                        <svg
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="m9 18 6-6-6-6" />
                                        </svg>
                                    </div>
                                </button>
                            </GlassCard>
                        </div>
                    )}

                    {/* NETWORK & IDENTITY SECTION */}
                    <div className="flex flex-col gap-2">
                        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-grayscale-500 px-2">
                            Network & Identity
                        </h3>
                        <GlassCard className="p-4 flex flex-col gap-4">
                            {email && !hasParentSwitchedProfile && (
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[14px] font-medium text-grayscale-700 px-1">
                                        Email Address
                                    </label>
                                    <TextInput
                                        value={email}
                                        onChange={() => {}}
                                        disabled={true}
                                        type="email"
                                        className="opacity-70"
                                    />
                                </div>
                            )}

                            {phone && (
                                <>
                                    {email && !hasParentSwitchedProfile && (
                                        <div className="border-t border-grayscale-200/60" />
                                    )}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[14px] font-medium text-grayscale-700 px-1">
                                            Phone Number
                                        </label>
                                        <TextInput
                                            value={phone}
                                            onChange={() => {}}
                                            disabled={true}
                                            type="tel"
                                            className="opacity-70"
                                        />
                                    </div>
                                </>
                            )}

                            {walletDid && (
                                <>
                                    {(email || phone) && (
                                        <div className="border-t border-grayscale-200/60" />
                                    )}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[14px] font-medium text-grayscale-700 px-1">
                                            {brandingConfig.name} Number (DID)
                                        </label>
                                        <div className="flex items-center justify-between bg-grayscale-100/80 rounded-[10px] px-4 py-3">
                                            <p className="text-grayscale-900 text-[14px] truncate mr-4 font-mono text-sm">
                                                {walletDid}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={copyToClipBoard}
                                                className="text-grayscale-500 hover:text-grayscale-900 transition-colors shrink-0"
                                            >
                                                <CopyStack className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </GlassCard>
                        <IssuerStatusCard walletDid={walletDid} />
                    </div>

                    {/* SECURITY SECTION */}
                    <div className="flex flex-col gap-2">
                        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-grayscale-500 px-2">
                            Security
                        </h3>
                        <GlassCard className="flex flex-col">
                            <button
                                type="button"
                                onClick={() =>
                                    newModal(<ExportSeedPhraseModal />, {
                                        sectionClassName: '!max-w-[450px]',
                                    })
                                }
                                className="flex items-center justify-between px-5 py-4 hover:bg-grayscale-50/50 transition-colors rounded-t-[20px]"
                            >
                                <div className="flex flex-col items-start">
                                    <span className="text-[15px] font-medium text-grayscale-900">
                                        Export Seed Phrase
                                    </span>
                                    <span className="text-sm text-grayscale-500">
                                        Backup your wallet recovery phrase
                                    </span>
                                </div>
                                <div className="text-grayscale-400">
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="m9 18 6-6-6-6" />
                                    </svg>
                                </div>
                            </button>

                            {!Capacitor.isNativePlatform() && (
                                <>
                                    <div className="border-t border-grayscale-200/60 mx-5" />
                                    <div className="flex items-center justify-between px-5 py-4 hover:bg-grayscale-50/50 transition-colors rounded-b-[20px]">
                                        <div className="flex flex-col items-start flex-1 mr-4">
                                            <span className="text-[15px] font-medium text-grayscale-900">
                                                Connect Handler
                                            </span>
                                            <span className="text-sm text-grayscale-500">
                                                Enable web-based credential handling
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleChapiInfo()}
                                                className="text-grayscale-400 hover:text-grayscale-600 p-2"
                                            >
                                                <InfoIcon />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleConnectChapi}
                                                className="flex items-center justify-center text-grayscale-700 bg-grayscale-100 hover:bg-grayscale-200 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                                            >
                                                <HandshakeIcon className="mr-2 w-4 h-4" /> Connect
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </GlassCard>
                    </div>

                    {/* DANGER ZONE */}
                    {showDeleteAccountButton && !hasParentSwitchedProfile && (
                        <div className="flex flex-col gap-2">
                            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-rose-500 px-2">
                                Danger Zone
                            </h3>
                            <GlassCard className="flex flex-col border-rose-100 ring-rose-500/10">
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
                                                    e: React.MouseEvent<
                                                        HTMLButtonElement,
                                                        MouseEvent
                                                    >
                                                ) => onLogout(e)}
                                            />
                                        );
                                    }}
                                    className="flex items-center justify-between px-5 py-4 hover:bg-rose-50/50 transition-colors rounded-[20px] group"
                                >
                                    <div className="flex flex-col items-start">
                                        <span className="text-[15px] font-medium text-rose-600 group-hover:text-rose-700">
                                            Delete Account
                                        </span>
                                        <span className="text-sm text-rose-400/80">
                                            Permanently remove your data
                                        </span>
                                    </div>
                                    <div className="text-rose-400 group-hover:text-rose-500">
                                        <TrashBin className="w-5 h-5" />
                                    </div>
                                </button>
                            </GlassCard>
                        </div>
                    )}
                </form>
            </div>

            {/* Sticky Footer */}
            <div
                className="shrink-0 relative z-20 bg-white/80 backdrop-blur-xl border-t border-grayscale-200/50"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <div className="max-w-[600px] mx-auto px-6 py-4 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={closeModal}
                        className="flex-1 bg-white text-grayscale-800 text-[17px] font-poppins font-medium py-3 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-grayscale-100 hover:bg-grayscale-50 transition-colors"
                    >
                        Back
                    </button>
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={handleSubmit}
                        className="flex-1 text-white text-[17px] font-poppins font-semibold py-3 rounded-full shadow-[0_4px_12px_rgba(79,70,229,0.25)] hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
                        style={{ backgroundColor: primaryColor }}
                    >
                        {isLoading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfileUpdateForm;
