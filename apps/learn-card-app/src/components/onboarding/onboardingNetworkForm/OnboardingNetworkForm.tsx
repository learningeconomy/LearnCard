import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';

import * as m from '../../../paraglide/messages.js';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { auth } from '../../../firebase/firebase';
import { updateProfile } from 'firebase/auth';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { getLogger } from 'learn-card-base';
const log = getLogger('onboarding-network-form');

import { IonCol, IonRow, IonInput, IonSpinner } from '@ionic/react';
import { ProfilePicture } from 'learn-card-base/components/profilePicture/ProfilePicture';
import OnboardingRoleItem from '../onboardingRoles/OnboardingRoleItem';
import OnboardingHeader from '../onboardingHeader/OnboardingHeader';
import OnboardingFooter from '../onboardingFooter/OnboardingFooter';
import OnboardingSwiperForSlides from '../onboardingRoles/OnboardingSwiperForSlides';
import ErrorLogout from '../../network-prompts/ErrorLogout';
import HandleIcon from 'learn-card-base/svgs/HandleIcon';
import { Checkmark } from '@learncard/react';
import Pencil from '../../svgs/Pencil';
import X from 'learn-card-base/svgs/X';

import { useTenantBrandingAssets } from '../../../config/brandingAssets';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

import { useFilestack, UploadRes } from 'learn-card-base';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import {
    authStore,
    currentUserStore,
    useSQLiteStorage,
    useModal,
    useWallet,
    useGetProfile,
    useGetCurrentLCNUser,
    useIsCurrentUserLCNUser,
    getNotificationsEndpoint,
    SocialLoginTypes,
    ModalTypes,
    useToast,
    useDeviceTypeByWidth,
    useUpdatePreferences,
} from 'learn-card-base';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';

import { getAuthToken } from 'learn-card-base/helpers/authHelpers';
import redirectStore from 'learn-card-base/stores/redirectStore';
import { calculateAge } from 'learn-card-base/helpers/dateHelpers';
import { LearnCardRoles, LearnCardRolesEnum, OnboardingStepsEnum } from '../onboarding.helpers';

import countries from '../../../constants/countries.json';
import EUParentalConsentModalContent from './components/EUParentalConsentModalContent';
import USConsentNoticeModalContent from './components/USConsentNoticeModalContent';
import { requiresEUParentalConsent, isEUCountry } from './helpers/gdpr';
import { getMinorAgeThreshold } from 'learn-card-base/constants/gdprAgeLimits';
import GuardianLinkedModal from '../GuardianLinkedModal';
import { StateValidator, ProfileIDStateValidator } from './helpers/validators';
import useLogout from '../../../hooks/useLogout';
import useAutoConsentLearnCardAi from '../../../hooks/useAutoConsentLearnCardAi';
import { useGetAiInsightsServicesContract } from '../../../pages/ai-insights/learner-insights/learner-insights.helpers';
import { useAnalytics, AnalyticsEvents } from '@analytics';

const COUNTRIES: Record<string, string> = countries as Record<string, string>;

// Components and helpers extracted to ./components and ./helpers

// Validators moved to ./onboardingNetworkForm/helpers/validators

type OnboardingNetworkFormProps = {
    showHeader?: boolean;
    containerClassName?: string;
    handleCloseModal: () => void;
    step?: OnboardingStepsEnum;
    role?: LearnCardRolesEnum | null;
    setStep?: (step: OnboardingStepsEnum) => void;
    onSuccess?: () => void;
    skipRoleSlides?: boolean;
    pendingInstall?: { listingId: string; appName: string; appIcon?: string } | null;
    formData: {
        name: string | null | undefined;
        dob: string | null | undefined;
        country: string | undefined;
        photo: string | null | undefined;
        usMinorConsent: boolean;
        euParentalConsentRequested: boolean;
        guardianEmail?: string;
        profileId: string | null | undefined;
    };
    updateFormData: (updates: Partial<OnboardingNetworkFormProps['formData']>) => void;
};

const OnboardingNetworkForm: React.FC<OnboardingNetworkFormProps> = ({
    handleCloseModal,
    showHeader = true,
    containerClassName,
    step,
    setStep,
    role,
    onSuccess,
    formData,
    updateFormData,
    skipRoleSlides,
    pendingInstall,
}) => {
    const brandingConfig = useBrandingConfig();
    const { appIcon } = useTenantBrandingAssets();
    const { initWallet } = useWallet();
    const { newModal, closeModal } = useModal();
    const { track } = useAnalytics();
    const { refetch } = useGetCurrentLCNUser();
    const { refetch: refetchIsCurrentUserLCNUser } = useIsCurrentUserLCNUser();
    const queryClient = useQueryClient();
    const { mutateAsync: updatePreferences } = useUpdatePreferences();
    const { isDesktop, isMobile } = useDeviceTypeByWidth();
    const flags = useFlags();
    const schoolCodes = (flags?.underageSchoolCodes as string[]) || [];

    const authToken = getAuthToken();
    const currentUser = useCurrentUser();
    const { updateCurrentUser } = useSQLiteStorage();
    const { handleLogout, isLoggingOut } = useLogout();
    const { autoConsentLearnCardAi } = useAutoConsentLearnCardAi();
    const {
        name,
        dob,
        country,
        photo,
        usMinorConsent,
        euParentalConsentRequested,
        guardianEmail,
        profileId,
    } = formData;

    const handleNameChange = (value: string) => {
        updateFormData({ name: value ?? '' });
    };
    const handleDobChange = (date: string) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.dob;
            return newErrors;
        });
        updateFormData({ dob: date });
    };
    const handleCountrySelect = (selectedCountry: string) => {
        updateFormData({ country: selectedCountry });
    };
    const handlePhotoUpload = (photoUrl: string) => {
        updateFormData({ photo: photoUrl });
    };
    const handleUsMinorConsentToggle = (value: boolean) => {
        updateFormData({ usMinorConsent: value });
    };

    const [networkToggle, setNetworkToggle] = useState<boolean>(true);

    const [isLengthValid, setIsLengthValid] = useState(false);
    const [isFormatValid, setIsFormatValid] = useState(false);
    const [isUniqueValid, setIsUniqueValid] = useState(false);

    const [walletDid, setWalletDid] = useState<string>('');

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [createLoading, setIsCreateLoading] = useState<boolean>(false);
    const [profileIdError, setProfileIdError] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [profileIdErrors, setProfileIdErrors] = useState<Record<string, string[]>>({});

    const [uploadProgress, setUploadProgress] = useState<number | false>(false);
    const { presentToast } = useToast();

    const { data: lcNetworkProfile, isLoading: profileLoading } = useGetProfile();

    const presentLogoutErrorModal = () => {
        newModal(<ErrorLogout />, { sectionClassName: '!max-w-[400px]' });
    };

    useEffect(() => {
        const getWalletDid = async () => {
            const wallet = await initWallet();
            setWalletDid(wallet?.id?.did());
        };

        if (!walletDid) {
            getWalletDid();
        }
    }, [walletDid]);
    const { getAiInsightsContractUri } = useGetAiInsightsServicesContract(walletDid, true);

    const {
        data: uniqueProfile,
        isLoading: uniqueProfileLoading,
        isFetching: uniqueProfileFetching,
    } = useGetProfile(profileId ?? '');

    useEffect(() => {
        setIsUniqueValid(false);
    }, [profileId]);

    useEffect(() => {
        if (!uniqueProfileFetching && profileId) {
            setIsUniqueValid(uniqueProfile === null);
        }
    }, [uniqueProfile, uniqueProfileFetching, profileId]);

    // Reset consent if user is no longer a teen or if country is in the EU (EU flow handled separately)
    useEffect(() => {
        const age = dob ? calculateAge(dob) : Number.NaN;
        const isTeen = !Number.isNaN(age) && age >= 13 && age <= 17;
        const inEU = country ? isEUCountry(country) : false;
        if (inEU || !isTeen) handleUsMinorConsentToggle(false);
    }, [country, dob]);

    const onUpload = (data: UploadRes) => {
        handlePhotoUpload(data?.url);
        setUploadProgress(false);
    };

    const { handleFileSelect: handleImageSelect, isLoading: imageUploadLoading } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data) => onUpload(data),
        options: { onProgress: event => setUploadProgress(event.totalPercent) },
    });

    const validate = (nameRequired: boolean) => {
        const parsedData = StateValidator.safeParse({
            name: nameRequired ? name : name || 'Apple User',
            dob: dob,
            country: country ?? '',
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
            setProfileIdError('');
            return true;
        }

        if (parsedData.error) {
            setProfileIdErrors(parsedData.error.flatten().fieldErrors);
        }

        return false;
    };

    const validateProfileIdValue = (value: string) => {
        const lengthOk = value.length >= 3 && value.length <= 25;
        setIsLengthValid(lengthOk);
        const formatOk = /^[a-zA-Z0-9-]+$/.test(value);
        setIsFormatValid(formatOk);
    };

    const handleProfileIdInput = (value: string) => {
        updateFormData({ profileId: value });
        setProfileIdErrors({});
        setProfileIdError('');
        validateProfileIdValue(value);
    };

    useEffect(() => {
        if (profileId) {
            validateProfileIdValue(profileId);
        }
    }, [role]);

    const handleStorageUpdate = async () => {
        if (!currentUser?.privateKey) return;
        await updateCurrentUser(currentUser.privateKey, {
            name: name ?? currentUser?.name ?? '',
            profileImage: photo ?? currentUser?.profileImage ?? '',
        });
        currentUserStore.set.currentUser({
            ...(currentUser as any),
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

                // Get Firebase ID token for server-side email auto-verification
                let authToken: string | undefined;
                try {
                    if (Capacitor.isNativePlatform()) {
                        const res = await FirebaseAuthentication.getIdToken({
                            forceRefresh: false,
                        });
                        authToken = res?.token;
                    } else {
                        const user = auth()?.currentUser;
                        authToken = user ? await user.getIdToken(false) : undefined;
                    }
                } catch (e) {
                    log.warn('Could not get Firebase ID token (non-fatal):', e);
                }

                const didWeb = await wallet.invoke.createProfile({
                    profileId: profileId as string,
                    displayName: name ?? '',
                    shortBio: '',
                    bio: '',
                    image: photo ?? '',
                    notificationsWebhook: getNotificationsEndpoint(),
                    role: role ?? '',
                    dob: dob ?? '',
                    country: country ?? '',
                    // EU minors stay unapproved until a guardian approves via email; the
                    // existing `profile.approved === false` re-prompt keeps gating them.
                    ...(euParentalConsentRequested ? { approved: false } : {}),
                    authToken,
                });

                if (didWeb) {
                    // Now that the profile exists, send the guardian approval email. This is
                    // deferred to here because sendGuardianApprovalEmail is keyed to the
                    // requester's profileId, which doesn't exist at the age-gate step.
                    if (euParentalConsentRequested && guardianEmail) {
                        try {
                            await wallet.invoke.sendGuardianApprovalEmail({ guardianEmail });
                        } catch (err) {
                            console.error('Failed to send guardian approval email:', err);
                        }
                    }
                    // Initialize privacy preferences based on age at signup
                    const age = dob ? calculateAge(dob) : null;
                    const limit = getMinorAgeThreshold(country);
                    const isMinorUser = age !== null && !isNaN(age) && age < limit;

                    const aiEnabled = !isMinorUser;
                    let preferencesInitialized = false;

                    await updatePreferences({
                        aiEnabled,
                        aiAutoDisabled: isMinorUser,
                        analyticsEnabled: aiEnabled,
                        analyticsAutoDisabled: isMinorUser,
                        bugReportsEnabled: aiEnabled,
                        isMinor: isMinorUser,
                    })
                        .then(() => {
                            preferencesInitialized = true;
                        })
                        .catch(err => {
                            log.error('Failed to initialize preferences (non-blocking):', err);
                        });

                    track(AnalyticsEvents.ONBOARDING_COMPLETED, {
                        role: role ?? undefined,
                        country: country ?? undefined,
                    });

                    // Check for pending guardian approvals linked to this email (non-blocking)
                    let claimedChildren: Array<{
                        childProfileId: string;
                        childDisplayName: string;
                        managerId: string | null;
                    }> = [];
                    try {
                        claimedChildren = (await wallet.invoke.claimPendingGuardianLinks?.()) ?? [];
                    } catch (err) {
                        log.error('claimPendingGuardianLinks failed (non-blocking):', err);
                    }

                    await refetchIsCurrentUserLCNUser();
                    await wallet.invoke.resetLCAClient();
                    await queryClient.resetQueries();
                    await refetch(); // refetch to sync -> useGetCurrentLCNUser hook
                    handleCloseModal();
                    setIsLoading(false);
                    setIsCreateLoading(false);

                    window.setTimeout(async () => {
                        try {
                            await autoConsentLearnCardAi({
                                enabled: aiEnabled && preferencesInitialized,
                                userOverrides: {
                                    name: name ?? currentUser?.name ?? '',
                                    profileImage: photo ?? currentUser?.profileImage ?? '',
                                },
                            });
                        } catch (err) {
                            log.error('Failed to auto-consent LearnCard AI after onboarding:', err);
                        }
                    }, 0);

                    setTimeout(async () => {
                        await onSuccess?.();
                    }, 1000);

                    if (skipRoleSlides && pendingInstall) {
                        // Hand install intent back to AppListingPage — its useEffect fires once
                        // isOnboardingOpen becomes false (set by OnboardingContainer on unmount)
                        redirectStore.set.installIntent(pendingInstall);
                    } else {
                        // Default: show role-specific onboarding slides
                        newModal(
                            <OnboardingSwiperForSlides
                                roleItem={LearnCardRoles?.find(r => r.type === role) ?? null}
                                dob={dob}
                            />,
                            {
                                sectionClassName: '!max-w-full',
                            },
                            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                        );
                    }

                    if (claimedChildren.length > 0) {
                        newModal(
                            <GuardianLinkedModal
                                children={claimedChildren}
                                onDismiss={closeModal}
                            />,
                            { sectionClassName: '!max-w-[400px]' },
                            { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
                        );
                    }
                }

                if (role === LearnCardRolesEnum.teacher) {
                    getAiInsightsContractUri().catch(err => {
                        log.info('getAiInsightsContractUri::error', err);
                    });
                }
            } catch (err) {
                log.info('createProfile::error', err);
                const message =
                    (err as any)?.message ??
                    (typeof err === 'string' ? err : 'There was an error creating your profile');
                setProfileIdError(message as string);
                setIsLoading(false);
                setIsCreateLoading(false);
            }
        }
    };

    const handleLCNetworkProfileUpdate = async () => {
        const wallet = await initWallet();

        if (lcNetworkProfile && lcNetworkProfile?.profileId) {
            const updatedProfile = await wallet?.invoke?.updateProfile({
                displayName: name ?? '',
                image: photo ?? '',
                dob: dob ?? '',
                role: role ?? '',
                notificationsWebhook: getNotificationsEndpoint(),
                country: country ?? '',
            });

            if (role === LearnCardRolesEnum.teacher) {
                getAiInsightsContractUri().catch(err => {
                    log.info('getAiInsightsContractUri::error', err);
                });
            }
        } else {
            await handleJoinLearnCardNetwork();
        }
    };

    // Ensure a LearnCard Network profile exists and is marked as unapproved when EU consent is required
    const ensureProfileApprovedFalse = async (): Promise<boolean> => {
        const wallet = await initWallet();

        if (lcNetworkProfile && lcNetworkProfile?.profileId) {
            // Update existing profile to set approved=false (and sync latest fields)
            const updated = await wallet?.invoke?.updateProfile({
                displayName: name ?? '',
                image: photo ?? '',
                dob: dob ?? '',
                role: role ?? '',
                notificationsWebhook: getNotificationsEndpoint(),
                country: country ?? '',
                approved: false,
            });
            return !!updated;
        } else {
            // Create a new profile with approved=false
            const didWeb = await wallet?.invoke?.createProfile({
                profileId: profileId as string,
                displayName: name ?? '',
                shortBio: '',
                bio: '',
                image: photo ?? '',
                notificationsWebhook: getNotificationsEndpoint(),
                role: role ?? '',
                dob: dob ?? '',
                country: country ?? '',
                approved: false,
            });

            if (didWeb) {
                await refetchIsCurrentUserLCNUser();
                await wallet?.invoke?.resetLCAClient();
                await queryClient.resetQueries();
                await refetch();
                return true;
            }
        }

        return false;
    };

    const presentUSConsentNoticeModal = () => {
        newModal(
            <USConsentNoticeModalContent
                onBack={closeModal}
                onContinue={() => {
                    handleUsMinorConsentToggle(true);
                    closeModal();
                    handleUpdateUser({ skipUsConsentCheck: true });
                }}
            />,
            {
                sectionClassName:
                    '!bg-transparent !border-none !shadow-none !rounded-none !mx-auto',
            },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    const presentEUParentalConsentModal = () => {
        newModal(
            <EUParentalConsentModalContent
                name={name}
                dob={dob}
                country={country}
                onClose={closeModal}
            />,
            {
                sectionClassName:
                    '!bg-transparent !border-none !shadow-none !rounded-none !mx-auto',
            },
            {
                desktop: ModalTypes.FullScreen,
                mobile: ModalTypes.FullScreen,
            }
        );
    };

    const handleUpdateUser = async (options?: { skipUsConsentCheck?: boolean }) => {
        const typeOfLogin = authStore.get.typeOfLogin();
        const nameRequired = typeOfLogin !== SocialLoginTypes.apple;

        if (!validate(nameRequired)) {
            return;
        }

        const age = dob ? calculateAge(dob) : Number.NaN;
        const isTeen = !Number.isNaN(age) && age >= 13 && age <= 17;

        // The age gate should intercept under-13 users before they reach this form.
        // Keep teen-consent fallbacks here for existing users and older flows.
        if (isTeen && country) {
            if (requiresEUParentalConsent(country, age) && !euParentalConsentRequested) {
                presentEUParentalConsentModal();
                return;
            }

            if (!isEUCountry(country) && !usMinorConsent && !options?.skipUsConsentCheck) {
                presentUSConsentNoticeModal();
                return;
            }
        }

        setIsLoading(true);

        try {
            const resolvedName = nameRequired ? name ?? '' : name ?? currentUser?.name ?? '';
            const resolvedPhoto = photo ?? currentUser?.profileImage ?? '';

            if (authToken === 'dummy') {
                currentUserStore.set.currentUser({
                    ...currentUser,
                    name: resolvedName,
                    profileImage: resolvedPhoto,
                });
            } else {
                try {
                    await updateProfile(auth()?.currentUser, {
                        displayName: resolvedName,
                        photoURL: resolvedPhoto,
                    });
                } catch (e) {
                    presentLogoutErrorModal();
                    setProfileIdError(`There was a firebase error: ${e?.toString?.()}`);
                }
            }

            await handleLCNetworkProfileUpdate();

            handleStorageUpdate();

            setIsLoading(false);
            handleCloseModal();
        } catch (error) {
            setIsLoading(false);
            log.error('updateProfile::error', error);
        }
    };

    const handleClick = () => {
        if (!isLoading) {
            handleUpdateUser();
        }
    };

    const placeholderStyles = {
        '--placeholder-color': '#52597a',
        fontSize: '16px',
        fontWeight: '400',
        fontFamily: 'Poppins',
    };

    const isCheckingUnique = uniqueProfileLoading || uniqueProfileFetching;

    // Disable Continue until required fields are valid
    const needsProfileId = networkToggle && !lcNetworkProfile?.profileId;
    const hasValidDob = Boolean(dob) && !Number.isNaN(calculateAge(dob as string));
    const hasValidCountry = Boolean(country);
    const hasValidProfileId =
        !needsProfileId ||
        (Boolean(profileId) &&
            isLengthValid &&
            isFormatValid &&
            isUniqueValid &&
            !isCheckingUnique);
    const isContinueDisabled =
        !hasValidDob ||
        !hasValidCountry ||
        !hasValidProfileId ||
        isLoading ||
        Object.keys(errors).length > 0;

    return (
        <div className="w-full h-full bg-white relative overflow-y-auto">
            <div className="max-w-[600px] mx-auto pt-[50px] px-4 relative">
                {pendingInstall && (
                    <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-3">
                        {pendingInstall.appIcon && (
                            <img
                                src={pendingInstall.appIcon}
                                alt=""
                                className="w-8 h-8 rounded-lg object-cover shrink-0"
                            />
                        )}
                        <p className="text-sm text-indigo-800 font-medium">
                            After creating your account, you'll be able to install{' '}
                            <span className="font-semibold">{pendingInstall.appName}</span>
                        </p>
                    </div>
                )}
                <OnboardingHeader text="Set up your profile to get started!" />
                {isLoading && (
                    <div className="absolute top-0 left-0 w-full h-full z-[10000] flex flex-col items-center justify-center bg-white bg-opacity-70 backdrop-blur-[3px]">
                        <IonSpinner color="dark" />
                        <span className="text-grayscale-900 flex items-center justify-center w-full">
                            Joining Network...
                        </span>
                    </div>
                )}

                <section className={`pt-[36px] pb-[16px] ${containerClassName}`}>
                    <IonRow class="w-full">
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

                    <div className="flex flex-col items-center justify-center w-full px-4 mt-4">
                        <div className="w-full flex items-center justify-center mb-4">
                            <OnboardingRoleItem
                                role={role ?? null}
                                roleItem={LearnCardRoles?.find(r => r.type === role) ?? null}
                                setRole={() => {}}
                                handleEdit={() => setStep?.(OnboardingStepsEnum.selectRole)}
                                showDescription={false}
                            />
                        </div>

                        <IonRow className="flex flex-col items-center justify-center w-full">
                            {lcNetworkProfile && lcNetworkProfile?.profileId && (
                                <IonInput
                                    autocapitalize="on"
                                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-wider text-base mb-4`}
                                    value={`@${lcNetworkProfile?.profileId}`}
                                    placeholder="User ID"
                                    type="text"
                                    aria-label="User ID"
                                    readonly
                                />
                            )}
                            <div className="flex flex-col items-center justify-center w-full">
                                <IonInput
                                    style={placeholderStyles}
                                    autocapitalize="on"
                                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base ${
                                        errors.name ? 'login-input-email-error' : ''
                                    }`}
                                    onIonInput={e => {
                                        setErrors({});
                                        handleNameChange(e.detail.value);
                                    }}
                                    value={name}
                                    placeholder="Full Name"
                                    type="text"
                                    aria-label="Full Name"
                                />
                                {errors.name && (
                                    <p className="p-0 m-0 w-full text-left mt-1 text-red-600 text-xs">
                                        {errors.name}
                                    </p>
                                )}
                            </div>
                        </IonRow>

                        {networkToggle && !lcNetworkProfile && (
                            <IonRow className="flex flex-col items-center justify-center w-full mt-4">
                                <div className="flex flex-col items-center justify-center w-full mb-4">
                                    <div
                                        className={`flex items-center w-full bg-grayscale-100 rounded-[15px] ${
                                            profileIdError || profileIdErrors?.profileId
                                                ? 'login-input-email-error'
                                                : ''
                                        }`}
                                    >
                                        <span className="pl-4 !pr-0 text-grayscale-500 select-none font-semibold">
                                            <HandleIcon className="w-[20px] h-[20px] text-grayscale-700" />
                                        </span>
                                        <IonInput
                                            style={placeholderStyles}
                                            autocapitalize="on"
                                            className={`flex-1 bg-transparent text-grayscale-800 !pr-4 !pl-2 !py-[6px] font-medium tracking-widest text-base text-left `}
                                            onIonInput={e => {
                                                handleProfileIdInput(e.detail.value);
                                            }}
                                            value={profileId}
                                            placeholder="User ID"
                                            aria-label="User ID"
                                            type="text"
                                        />
                                    </div>
                                    {(profileIdError || profileIdErrors?.profileId) && (
                                        <p className="p-0 m-0 mt-1 w-full text-left text-sm text-red-600">
                                            {profileIdError}
                                            {profileIdErrors?.profileId?.map(e => e)}
                                        </p>
                                    )}
                                </div>

                                <div className="w-full flex flex-col justify-center items-start text-left">
                                    <p className="flex items-center justify-start gap-1 text-grayscale-700 text-xs font-normal min-h-[20px] h-[20px]">
                                        {isLengthValid ? (
                                            <Checkmark className="w-[20px] h-auto" />
                                        ) : (
                                            <X className="w-[20px] h-auto scale-[0.9]" />
                                        )}
                                        Must be between 3 to 25 characters.
                                    </p>

                                    <p className="flex items-center gap-1 text-grayscale-700 text-xs font-normal min-h-[20px] h-[20px]">
                                        {isFormatValid ? (
                                            <Checkmark className="w-[20px] h-auto" />
                                        ) : (
                                            <X className="w-[20px] h-auto scale-[0.9]" />
                                        )}
                                        Letters, numbers, and dashes (-) only.
                                    </p>

                                    <p className="flex items-center gap-1 text-grayscale-700 text-xs font-normal min-h-[20px] h-[20px]">
                                        {isCheckingUnique && (
                                            <IonSpinner
                                                name="crescent"
                                                className="h-[20px] w-[20px] scale-[0.75]"
                                            />
                                        )}
                                        {isUniqueValid && !isCheckingUnique && (
                                            <Checkmark className="w-[20px] h-auto" />
                                        )}
                                        {!isUniqueValid && !isCheckingUnique && (
                                            <X className="w-[20px] h-auto scale-[0.9]" />
                                        )}
                                        Must be unique.
                                    </p>
                                </div>
                            </IonRow>
                        )}
                    </div>
                </section>

                <p className="text-center text-sm font-normal px-16 text-grayscale-600 mt-4">
                    {m['legal.dataOwnership']()}
                    <br />
                    All connections are encrypted.
                </p>
            </div>
            <OnboardingFooter
                step={step}
                role={role}
                setStep={setStep}
                text={isLoading ? 'Loading...' : 'Continue'}
                onClick={handleClick}
                showBackButton
                showCloseButton={!!lcNetworkProfile?.profileId}
                disabled={isContinueDisabled}
            />
        </div>
    );
};

export default OnboardingNetworkForm;
