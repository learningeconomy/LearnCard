import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { auth } from '../../../firebase/firebase';
import { updateProfile } from 'firebase/auth';
import moment from 'moment';

import { IonCol, IonRow, IonInput, IonSpinner, IonDatetime } from '@ionic/react';
import { ProfilePicture } from 'learn-card-base/components/profilePicture/ProfilePicture';
import OnboardingRoleItem from '../onboardingRoles/OnboardingRoleItem';
import OnboardingHeader from '../onboardingHeader/OnboardingHeader';
import OnboardingFooter from '../onboardingFooter/OnboardingFooter';
import ErrorLogout from '../../network-prompts/ErrorLogout';
import HandleIcon from 'learn-card-base/svgs/HandleIcon';
import { Checkmark } from '@learncard/react';
import Calendar from '../../svgs/Calendar';
import Pencil from '../../svgs/Pencil';
import AddUser from '../../svgs/AddUser';
import X from 'learn-card-base/svgs/X';

import LocationIcon from '../../svgs/LocationIcon';
import LearnCardLogo from '../../../assets/images/lca-icon-v2.png';

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
    BrandingEnum,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';

import { getAuthToken } from 'learn-card-base/helpers/authHelpers';
import { calculateAge } from 'learn-card-base/helpers/dateHelpers';
import { LearnCardRoles, LearnCardRolesEnum, OnboardingStepsEnum } from '../onboarding.helpers';

import countries from '../../../constants/countries.json';
import CountrySelectorModal from './components/CountrySelectorModal';
import EUParentalConsentModalContent from './components/EUParentalConsentModalContent';
import UnderageModalContent from './components/UnderageModalContent';
import USConsentNoticeModalContent from './components/USConsentNoticeModalContent';
import { requiresEUParentalConsent, isEUCountry } from './helpers/gdpr';
import { StateValidator, ProfileIDStateValidator, DobValidator } from './helpers/validators';
import useLogout from '../../../hooks/useLogout';
import { useGetAiInsightsServicesContract } from '../../../pages/ai-insights/learner-insights/learner-insights.helpers';

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
};

const OnboardingNetworkForm: React.FC<OnboardingNetworkFormProps> = ({
    handleCloseModal,
    showHeader = true,
    containerClassName,
    step,
    setStep,
    role,
    onSuccess,
}) => {
    const { initWallet } = useWallet();
    const { newModal, closeModal } = useModal();
    const { refetch } = useGetCurrentLCNUser();
    const { refetch: refetchIsCurrentUserLCNUser } = useIsCurrentUserLCNUser();
    const queryClient = useQueryClient();

    const authToken = getAuthToken();
    const currentUser = useCurrentUser();
    const { updateCurrentUser } = useSQLiteStorage();
    const { handleLogout, isLoggingOut } = useLogout();

    const [name, setName] = useState<string | null | undefined>(currentUser?.name ?? '');
    const [dob, setDob] = useState<string | null | undefined>('');
    const [country, setCountry] = useState<string | undefined>(undefined);
    const [photo, setPhoto] = useState<string | null | undefined>(currentUser?.profileImage ?? '');
    const [usMinorConsent, setUsMinorConsent] = useState<boolean>(false);

    const [networkToggle, setNetworkToggle] = useState<boolean>(true);

    const [profileId, setProfileId] = useState<string | null | undefined>('');
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
        if (inEU || !isTeen) setUsMinorConsent(false);
    }, [country, dob]);

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

    const handleProfileIdInput = (value: string) => {
        setProfileId(value);
        setProfileIdErrors({});
        setProfileIdError('');

        const lengthOk = value.length >= 3 && value.length <= 25;
        setIsLengthValid(lengthOk);

        const formatOk = /^[a-zA-Z0-9-]+$/.test(value);
        setIsFormatValid(formatOk);
    };

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
                });

                if (didWeb) {
                    await refetchIsCurrentUserLCNUser();
                    await wallet.invoke.resetLCAClient();
                    await queryClient.resetQueries();
                    await refetch(); // refetch to sync -> useGetCurrentLCNUser hook
                    handleCloseModal();
                    setIsLoading(false);
                    setIsCreateLoading(false);

                    setTimeout(async () => {
                        await onSuccess?.();
                    }, 1000);
                }

                if (role === LearnCardRolesEnum.teacher) {
                    getAiInsightsContractUri().catch(err => {
                        console.log('getAiInsightsContractUri::error', err);
                    });
                }
            } catch (err) {
                console.log('createProfile::error', err);
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
                    console.log('getAiInsightsContractUri::error', err);
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

    const presentUnderageModal = () => {
        const onAdult = () => {
            // Present intermediate confirmation modal before logging out
            newModal(
                <div className="flex flex-col gap-[10px] items-center w-full h-full justify-center px-[20px]">
                    <div className="w-full bg-white rounded-[24px] px-[20px] py-[28px] shadow-3xl text-center max-w-[500px]">
                        <div className="mx-auto mb-3 flex items-center justify-center gap-3 w-full">
                            <div className="h-[56px] w-[56px] rounded-full overflow-hidden border-2 border-white shadow-3xl">
                                <img
                                    src={LearnCardLogo}
                                    alt="LearnCard logo"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="h-[50px] w-[50px] rounded-full bg-grayscale-100 flex items-center justify-center border border-grayscale-200">
                                <AddUser
                                    version="3"
                                    className="h-[28px] w-[28px] text-grayscale-800"
                                />
                            </div>
                        </div>
                        <h2 className="text-[22px] font-semibold text-grayscale-900 mb-2 font-noto">
                            Add Your Child to LearnCard!
                        </h2>
                        <p className="text-grayscale-700 text-[17px] leading-[24px] px-[10px]">
                            Log in or sign up to create your profile inside a family account.
                        </p>
                    </div>

                    <div className="w-full flex gap-[10px] justify-center px-[10px] left-[0px] items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 absolute bottom-0 bg-white !max-h-[100px] safe-area-bottom">
                        <div className="w-full max-w-[700px] flex">
                            <button
                                type="button"
                                onClick={closeModal}
                                className=" mx-[10px] shadow-button-bottom flex-1 py-[10px] text-[17px] bg-white rounded-[40px] text-grayscale-900 shadow-box-bottom border border-grayscale-200"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    newModal(
                                        <div className="w-full h-full transparent flex items-center justify-center">
                                            <div className="bg-white text-grayscale-800 w-full rounded-[16px] shadow-3xl z-50 font-notoSans max-w-[400px] p-4 text-center">
                                                <div className="flex items-center justify-center mb-2">
                                                    <IonSpinner
                                                        name="crescent"
                                                        className="w-[28px] h-[28px] text-grayscale-700"
                                                    />
                                                </div>
                                                <p className="text-grayscale-900 text-[16px] font-semibold">
                                                    Logging out...
                                                </p>
                                                <p className="text-grayscale-700 text-[14px] mt-1">
                                                    Please get a parent or guardian to login and
                                                    create a family account.
                                                </p>
                                            </div>
                                        </div>,
                                        {
                                            disableCloseHandlers: true,
                                            sectionClassName:
                                                '!bg-transparent !border-none !shadow-none !rounded-none',
                                        },
                                        { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
                                    );
                                    handleLogout(BrandingEnum.learncard, {
                                        appendQuery: { redirectTo: '/families?createFamily=true' },
                                    });
                                }}
                                className="mx-[10px] shadow-button-bottom font-semibold flex-1 py-[10px] text-[17px] bg-emerald-700 rounded-[40px] text-white shadow-box-bottom"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>,
                {
                    sectionClassName:
                        '!bg-transparent !border-none !shadow-none !rounded-none p-[20px] !mx-auto',
                },
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
        };

        newModal(
            <UnderageModalContent
                onBack={closeModal}
                onAdult={onAdult}
                isLoggingOut={isLoggingOut}
            />,
            {
                sectionClassName:
                    '!bg-transparent !border-none !shadow-none !rounded-none p-[20px] !mx-auto',
            },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    const presentUSConsentNoticeModal = () => {
        newModal(
            <USConsentNoticeModalContent
                onBack={closeModal}
                onContinue={() => {
                    setUsMinorConsent(true);
                    closeModal();
                    handleUpdateUser({ skipUsConsentCheck: true });
                    console.log('///onContinue');
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
        console.log('//handleUpdateUser');

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

            // Require country selection for compliance
            if (!country) {
                setErrors(prev => ({ ...prev, country: [' Country is required.'] }));
                return;
            }

            // Teen consent flows (age 13-17)
            const isTeen = !Number.isNaN(age) && age >= 13 && age <= 17;
            if (isTeen && country) {
                if (requiresEUParentalConsent(country, age)) {
                    try {
                        setIsLoading(true);
                        const success = await ensureProfileApprovedFalse();
                        if (success) closeModal();
                        else
                            presentToast(
                                'Could not create your profile. You can still request parental consent now. Please try profile setup again later.',
                                {
                                    type: ToastTypeEnum.Error,
                                    hasDismissButton: true,
                                }
                            );
                    } catch (e) {
                        console.log('ensureProfileApprovedFalse::error', e);
                    } finally {
                        setIsLoading(false);
                    }
                    presentEUParentalConsentModal();
                    return;
                }

                // For all non-EU countries, require consent notice
                if (!isEUCountry(country)) {
                    if (!usMinorConsent && !options?.skipUsConsentCheck) {
                        presentUSConsentNoticeModal();
                        return;
                    }
                }
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
            const age = dob ? calculateAge(dob) : Number.NaN;
            if (!Number.isNaN(age) && age < 13) {
                setErrors(prev => ({ ...prev, dob: [' You must be at least 13 years old.'] }));
                presentUnderageModal();
                return;
            }

            if (validate()) {
                // Teen consent flows (age 13-17)
                const isTeen = !Number.isNaN(age) && age >= 13 && age <= 17;
                if (isTeen && country) {
                    if (requiresEUParentalConsent(country, age)) {
                        try {
                            setIsLoading(true);
                            const success = await ensureProfileApprovedFalse();
                            if (success) closeModal();
                            else
                                presentToast(
                                    'Could not create your profile. You can still request parental consent now. Please try profile setup again later.',
                                    {
                                        type: ToastTypeEnum.Error,
                                        hasDismissButton: true,
                                    }
                                );
                        } catch (e) {
                            console.log('ensureProfileApprovedFalse::error', e);
                        } finally {
                            setIsLoading(false);
                        }
                        presentEUParentalConsentModal();
                        return;
                    }

                    // For all non-EU countries, require consent notice
                    if (!isEUCountry(country)) {
                        if (!usMinorConsent && !options?.skipUsConsentCheck) {
                            presentUSConsentNoticeModal();
                            return;
                        }
                    }
                }

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
                        // update firebase profile
                        try {
                            await updateProfile(auth()?.currentUser, {
                                displayName: name,
                                photoURL: photo,
                            });
                        } catch (e) {
                            presentLogoutErrorModal();
                            setProfileIdError(`There was a firebase error: ${e?.toString?.()}`);
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
    const isContinueDisabled = !hasValidDob || !hasValidCountry || !hasValidProfileId || isLoading;

    return (
        <div className="w-full h-full bg-white relative overflow-y-auto">
            <div className="max-w-[600px] mx-auto pt-[50px] px-4 relative">
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
                                        setName(e.detail.value);
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

                            <div className="flex flex-col items-center justify-center w-full mt-2">
                                <button
                                    className={`w-full flex items-center justify-between bg-grayscale-100 text-grayscale-500 rounded-[15px] font-poppins font-normal px-[16px] py-[16px] tracking-wider text-base ${
                                        errors?.dob ? 'login-input-email-error' : ''
                                    }`}
                                    onClick={() => {
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
                            <div className="flex flex-col items-center justify-center w-full mt-2">
                                <button
                                    className={`w-full flex items-center justify-between bg-grayscale-100 text-grayscale-500 rounded-[15px] font-poppins font-normal px-[16px] pr-[10px] py-[5px] tracking-wider text-base ${
                                        errors?.country ? 'login-input-email-error' : ''
                                    }`}
                                    onClick={() => {
                                        newModal(
                                            <CountrySelectorModal
                                                selected={country}
                                                onSelect={code => {
                                                    setErrors(prev => {
                                                        const next = { ...prev };
                                                        delete next.country;
                                                        return next;
                                                    });
                                                    setCountry(code);
                                                    closeModal();
                                                }}
                                            />,
                                            {
                                                sectionClassName:
                                                    '!bg-transparent !border-none !shadow-none !rounded-none',
                                            },
                                            {
                                                desktop: ModalTypes.Cancel,
                                                mobile: ModalTypes.Cancel,
                                            }
                                        );
                                    }}
                                >
                                    {country ? COUNTRIES[country] : 'Country of Residence'}
                                    <LocationIcon className="w-[44px] text-grayscale-700" />
                                </button>
                                {errors?.country && (
                                    <p className="p-0 m-0 w-full text-left mt-1 text-red-600 text-xs">
                                        {errors?.country}
                                    </p>
                                )}
                                <p className="text-grayscale-700 text-xs px-[0px] mt-[5px]">
                                    We ask for your age and country to make sure we comply with
                                    privacy laws and keep you safe.
                                </p>
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
                    You own your own data.
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
