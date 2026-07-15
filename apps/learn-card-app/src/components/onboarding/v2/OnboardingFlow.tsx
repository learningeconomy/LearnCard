import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { auth } from '../../../firebase/firebase';
import { updateProfile } from 'firebase/auth';
import { Check, Loader2, Edit2, ShieldCheck, User } from 'lucide-react';

import {
    useModal,
    useWallet,
    useGetProfile,
    useGetCurrentLCNUser,
    useIsCurrentUserLCNUser,
    getNotificationsEndpoint,
    useUpdatePreferences,
    useSQLiteStorage,
    currentUserStore,
    ModalTypes,
    useDeviceTypeByWidth,
    UploadRes,
    useFilestack,
    getLogger,
    Toggle,
} from 'learn-card-base';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { getAuthToken } from 'learn-card-base/helpers/authHelpers';
import redirectStore from 'learn-card-base/stores/redirectStore';
import { calculateAge, isFutureDate } from 'learn-card-base/helpers/dateHelpers';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

import { useAppAuth } from '../../../providers/AuthCoordinatorProvider';
import { generateEd25519PrivateKey } from '@learncard/sss-key-manager';
import { getSigningLearnCard } from 'learn-card-base/helpers/walletHelpers';

import { LearnCardRolesEnum, LearnCardRoles } from '../onboarding.helpers';
import { isEUCountry, requiresEUParentalConsent } from '../onboardingNetworkForm/helpers/gdpr';
import { getDefaultPrivacyPreferences, OnboardingPrivacyPreferences } from '../privacyPreferences';
import { ProfileIDStateValidator } from '../onboardingNetworkForm/helpers/validators';
import { generateHandle, generateRandomSuffix } from './handleGenerator';
import { inferCountryCode } from './countryInference';

import BirthdayPicker from './BirthdayPicker';
import CountrySelectorModal from '../onboardingNetworkForm/components/CountrySelectorModal';
import LocationIcon from '../../svgs/LocationIcon';
import UnderageModalContent from '../onboardingNetworkForm/components/UnderageModalContent';
import GuardianLinkedModal from '../GuardianLinkedModal';
import { Confetti } from '../../../pages/issue/components/Confetti';

import useLogout from '../../../hooks/useLogout';
import useAutoConsentLearnCardAi from '../../../hooks/useAutoConsentLearnCardAi';
import {
    useAnalytics,
    AnalyticsEvents,
    NEW_SIGNUP_FLAG_KEY,
    ONBOARDING_STARTED_AT_KEY,
} from '@analytics';

import countries from '../../../constants/countries.json';
const COUNTRIES: Record<string, string> = countries as Record<string, string>;

const log = getLogger('onboarding-flow-v2');

type Step = 'age-country' | 'profile' | 'celebrate';

type OnboardingFlowProps = {
    onSuccess?: () => void;
};

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onSuccess }) => {
    const { newModal, closeModal } = useModal();
    const { state: coordinatorState, setupNewKey } = useAppAuth();
    const { initWallet } = useWallet();
    const { track } = useAnalytics();
    const { mutateAsync: updatePreferences } = useUpdatePreferences();
    const { refetch } = useGetCurrentLCNUser();
    const { refetch: refetchIsCurrentUserLCNUser } = useIsCurrentUserLCNUser();
    const queryClient = useQueryClient();
    const { isDesktop } = useDeviceTypeByWidth();
    const { handleLogout } = useLogout();
    const { autoConsentLearnCardAi } = useAutoConsentLearnCardAi();
    const { updateCurrentUser } = useSQLiteStorage();

    const brandingConfig = useBrandingConfig();
    const brandName = brandingConfig?.name || 'LearnCard';
    const history = useHistory();

    const currentUser = useCurrentUser();
    const authToken = getAuthToken();

    const flowStartedAt = useRef(
        Number(localStorage.getItem(ONBOARDING_STARTED_AT_KEY) ?? Date.now())
    );

    useEffect(() => {
        if (!localStorage.getItem(ONBOARDING_STARTED_AT_KEY)) {
            localStorage.setItem(ONBOARDING_STARTED_AT_KEY, String(flowStartedAt.current));
        }
        redirectStore.set.isOnboardingOpen(true);
        return () => {
            redirectStore.set.isOnboardingOpen(false);
        };
    }, []);

    const [step, setStep] = useState<Step>('age-country');
    const [isPreparingKey, setIsPreparingKey] = useState(false);
    const didPrepareNewKeyRef = useRef(false);
    const prepareNewKeyPromiseRef = useRef<Promise<boolean> | null>(null);
    const handleLockedRef = useRef(false);

    // Form State
    const [dob, setDob] = useState<string>('');
    const [country, setCountry] = useState<string>('');
    const [usMinorConsent, setUsMinorConsent] = useState(false);

    useEffect(() => {
        setCountry(prev => prev || inferCountryCode() || '');
    }, []);

    const [euParentalConsentRequested, setEuParentalConsentRequested] = useState(false);
    const [guardianEmail, setGuardianEmail] = useState('');

    const [name, setName] = useState(currentUser?.name ?? '');
    const [photo, setPhoto] = useState(currentUser?.profileImage ?? '');
    const [profileId, setProfileId] = useState('');
    const [isHandleManuallyEdited, setIsHandleManuallyEdited] = useState(false);

    const [privacyPreferences, setPrivacyPreferences] =
        useState<OnboardingPrivacyPreferences | null>(null);
    const [role, setRole] = useState<LearnCardRolesEnum>(LearnCardRolesEnum.learner);

    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Handle Validation
    const [isLengthValid, setIsLengthValid] = useState(false);
    const [isFormatValid, setIsFormatValid] = useState(false);
    const [isUniqueValid, setIsUniqueValid] = useState(false);
    const [profileIdError, setProfileIdError] = useState<string>('');

    const { data: uniqueProfile, isFetching: uniqueProfileFetching } = useGetProfile(
        profileId || ''
    );

    useEffect(() => {
        if (handleLockedRef.current) return;
        if (uniqueProfileFetching) {
            setIsUniqueValid(false);
        } else if (profileId) {
            setIsUniqueValid(uniqueProfile === null);
        }
    }, [uniqueProfile, uniqueProfileFetching, profileId]);

    const validateProfileIdValue = (value: string) => {
        const lengthOk = value.length >= 3 && value.length <= 25;
        setIsLengthValid(lengthOk);
        const formatOk = /^[a-zA-Z0-9-]+$/.test(value);
        setIsFormatValid(formatOk);
    };

    useEffect(() => {
        if (profileId) {
            validateProfileIdValue(profileId);
        }
    }, [profileId]);

    useEffect(() => {
        if (handleLockedRef.current || isHandleManuallyEdited) return;

        const trimmed = name.trim();
        if (!trimmed) {
            setProfileId('');
            return;
        }

        const timeout = window.setTimeout(() => {
            setProfileId(prev => {
                const next = generateHandle(trimmed);
                return next === prev ? prev : next;
            });
        }, 400);

        return () => window.clearTimeout(timeout);
    }, [name, isHandleManuallyEdited]);

    // Handle collision resolution
    useEffect(() => {
        if (
            !handleLockedRef.current &&
            !isHandleManuallyEdited &&
            profileId &&
            !uniqueProfileFetching &&
            uniqueProfile != null
        ) {
            setProfileId(prev => {
                const base = prev.replace(/-[a-z0-9]{4}$/, '');
                return `${base.substring(0, 20)}-${generateRandomSuffix()}`;
            });
        }
    }, [uniqueProfile, uniqueProfileFetching, isHandleManuallyEdited, profileId]);

    // Pre-fill from Firebase
    useEffect(() => {
        if (auth()?.currentUser) {
            const fbUser = auth()?.currentUser;
            if (fbUser?.displayName && !name) setName(fbUser.displayName);
            if (fbUser?.photoURL && !photo) setPhoto(fbUser.photoURL);
        }
    }, [name, photo]);

    // Photo Upload
    const onUpload = (data: UploadRes) => {
        setPhoto(data?.url);
    };

    const { handleFileSelect: handleImageSelect, isLoading: imageUploadLoading } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data) => onUpload(data),
    });

    // Key Preparation
    const deriveDidFromPrivateKey = useCallback(async (privateKey: string): Promise<string> => {
        const lc = await getSigningLearnCard(privateKey);
        return lc?.id.did() || '';
    }, []);

    const prepareNewUserKey = useCallback(async (): Promise<boolean> => {
        if (didPrepareNewKeyRef.current || coordinatorState.status === 'ready') {
            return true;
        }

        if (coordinatorState.status !== 'needs_setup') {
            if (currentUser?.privateKey) return true;
            setError('Something went wrong. Please sign in again.');
            return false;
        }

        if (prepareNewKeyPromiseRef.current) {
            return prepareNewKeyPromiseRef.current;
        }

        const preparePromise = (async (): Promise<boolean> => {
            setIsPreparingKey(true);
            try {
                const privateKey = await generateEd25519PrivateKey();
                const did = await deriveDidFromPrivateKey(privateKey);
                if (!did) throw new Error('Failed to derive account identity');
                await setupNewKey(privateKey, did);
                didPrepareNewKeyRef.current = true;
                return true;
            } catch (e) {
                setError('Something went wrong. Please try again.');
                return false;
            } finally {
                setIsPreparingKey(false);
                prepareNewKeyPromiseRef.current = null;
            }
        })();

        prepareNewKeyPromiseRef.current = preparePromise;
        return preparePromise;
    }, [coordinatorState.status, currentUser?.privateKey, deriveDidFromPrivateKey, setupNewKey]);

    // Screen 1 Logic
    const age = useMemo(() => {
        if (!dob) return null;
        const parsedAge = calculateAge(dob);
        return Number.isNaN(parsedAge) ? null : parsedAge;
    }, [dob]);

    const isTeen = age !== null && age >= 13 && age <= 17;
    const inEU = country ? isEUCountry(country) : false;
    const needsEUConsent = isTeen && inEU && requiresEUParentalConsent(country, age);
    const needsUSConsent = isTeen && !inEU;

    const canContinueScreen1 = useMemo(() => {
        if (!dob || !country) return false;
        if (age === null) return false;
        if (age < 13) return true;
        if (needsEUConsent && (!guardianEmail || !/^\S+@\S+\.\S+$/.test(guardianEmail)))
            return false;
        if (needsUSConsent && !usMinorConsent) return false;
        return true;
    }, [dob, country, age, needsEUConsent, guardianEmail, needsUSConsent, usMinorConsent]);

    const handleScreen1Continue = async () => {
        setError(null);
        if (isFutureDate(dob)) {
            setError('Date of birth cannot be in the future.');
            return;
        }
        if (age !== null && age < 13) {
            const familyInviteUrl = `${
                window.location.origin
            }/login?redirectTo=${encodeURIComponent('/families?createFamily=true')}`;
            newModal(
                <UnderageModalContent
                    onBack={closeModal}
                    onAdult={() => {
                        closeModal();
                        handleLogout({
                            overrideRedirectUrl:
                                '/login?redirectTo=%2Ffamilies%3FcreateFamily%3Dtrue',
                        });
                    }}
                    isLoggingOut={false}
                    schoolCodes={[]}
                    onBypass={async () => {
                        closeModal();
                        if (await prepareNewUserKey()) {
                            setPrivacyPreferences(getDefaultPrivacyPreferences(dob, country));
                            setStep('profile');
                        }
                    }}
                    familyInviteUrl={familyInviteUrl}
                />,
                {
                    sectionClassName:
                        '!bg-transparent !border-none !shadow-none !rounded-none p-[20px] !mx-auto',
                },
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
            return;
        }

        if (needsEUConsent) {
            setEuParentalConsentRequested(true);
        }

        if (await prepareNewUserKey()) {
            setPrivacyPreferences(getDefaultPrivacyPreferences(dob, country));
            setStep('profile');
        }
    };

    // Screen 2 Logic
    const handleCreateProfile = async () => {
        const parsedData = ProfileIDStateValidator.safeParse({ profileId });
        if (!parsedData.success) {
            setProfileIdError(
                parsedData.error.flatten().fieldErrors.profileId?.[0] || 'Invalid User ID'
            );
            return;
        }

        if (!isLengthValid || !isFormatValid || !isUniqueValid || uniqueProfileFetching) {
            return;
        }

        setError(null);
        setIsCreating(true);

        try {
            const wallet = await initWallet();

            let fbAuthToken: string | undefined;
            try {
                if (Capacitor.isNativePlatform()) {
                    const res = await FirebaseAuthentication.getIdToken({ forceRefresh: false });
                    fbAuthToken = res?.token;
                } else {
                    const user = auth()?.currentUser;
                    fbAuthToken = user ? await user.getIdToken(false) : undefined;
                }
            } catch (e) {
                log.warn('Could not get Firebase ID token (non-fatal):', e);
            }

            const didWeb = await wallet.invoke.createProfile({
                profileId,
                displayName: name,
                shortBio: '',
                bio: '',
                image: photo,
                notificationsWebhook: getNotificationsEndpoint(),
                role,
                dob,
                country,
                ...(euParentalConsentRequested ? { approved: false } : {}),
                authToken: fbAuthToken,
            });

            if (didWeb) {
                if (euParentalConsentRequested && guardianEmail) {
                    try {
                        await wallet.invoke.sendGuardianApprovalEmail({ guardianEmail });
                    } catch (err) {
                        log.error('Failed to send guardian approval email:', err);
                    }
                }

                const selectedPrivacyPreferences =
                    privacyPreferences ?? getDefaultPrivacyPreferences(dob, country);
                const aiEnabled = selectedPrivacyPreferences.isMinor
                    ? false
                    : selectedPrivacyPreferences.aiEnabled;
                let preferencesInitialized = false;

                await updatePreferences({
                    ...selectedPrivacyPreferences,
                    aiEnabled,
                    aiAutoDisabled: selectedPrivacyPreferences.isMinor,
                    analyticsAutoDisabled: false,
                })
                    .then(() => {
                        preferencesInitialized = true;
                    })
                    .catch(err => log.error('Failed to persist privacy preferences:', err));

                track(AnalyticsEvents.ONBOARDING_COMPLETED, {
                    role,
                    country,
                    msSinceMethodStarted: Date.now() - flowStartedAt.current,
                });

                localStorage.setItem(NEW_SIGNUP_FLAG_KEY, '1');
                localStorage.removeItem(ONBOARDING_STARTED_AT_KEY);

                let claimedChildren: Awaited<
                    ReturnType<NonNullable<typeof wallet.invoke.claimPendingGuardianLinks>>
                > = [];
                try {
                    claimedChildren = (await wallet.invoke.claimPendingGuardianLinks?.()) ?? [];
                } catch (err) {
                    log.error('claimPendingGuardianLinks failed:', err);
                }

                if (authToken !== 'dummy') {
                    try {
                        const fbUser = auth()?.currentUser;
                        if (fbUser) {
                            await updateProfile(fbUser, {
                                displayName: name,
                                photoURL: photo,
                            });
                        }
                    } catch (e) {
                        log.error('Firebase updateProfile error:', e);
                    }
                }

                if (currentUser?.privateKey) {
                    await updateCurrentUser(currentUser.uid, { name, profileImage: photo });
                    currentUserStore.set.currentUser({
                        ...currentUser,
                        name,
                        profileImage: photo,
                    });
                }

                handleLockedRef.current = true;
                await refetchIsCurrentUserLCNUser();
                await wallet.invoke.resetLCAClient();
                await queryClient.resetQueries();
                await refetch();

                window.setTimeout(async () => {
                    try {
                        await autoConsentLearnCardAi({
                            enabled: aiEnabled && preferencesInitialized,
                            userOverrides: { name, profileImage: photo },
                        });
                    } catch (err) {
                        log.error('Failed to auto-consent LearnCard AI:', err);
                    }
                }, 0);

                if (claimedChildren.length > 0) {
                    newModal(
                        <GuardianLinkedModal children={claimedChildren} onDismiss={closeModal} />,
                        { sectionClassName: '!max-w-[400px]' },
                        { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
                    );
                }

                setStep('celebrate');
            }
        } catch (err: any) {
            log.error('createProfile::error', err);
            setError(err?.message || 'There was an error creating your profile');
        } finally {
            setIsCreating(false);
        }
    };

    // Screen 3 Logic
    const handleExplore = async () => {
        closeModal();

        if (onSuccess) {
            await onSuccess();
        } else {
            history.push('/dashboard');
        }
    };

    const handleRoleSelect = async (selectedRole: LearnCardRolesEnum) => {
        setRole(selectedRole);
        try {
            const wallet = await initWallet();
            const updated = await wallet?.invoke?.updateProfile({ role: selectedRole });
            if (updated) {
                await queryClient.invalidateQueries({ queryKey: ['getProfile'] });
            }
        } catch (e) {
            log.error('Failed to update role:', e);
        }
    };

    const renderProgress = (currentStep: number) => (
        <div className="flex items-center justify-center gap-2 mb-8">
            <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentStep === 1 ? 'w-6 bg-grayscale-900' : 'w-1.5 bg-grayscale-300'
                }`}
            />
            <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentStep === 2 ? 'w-6 bg-grayscale-900' : 'w-1.5 bg-grayscale-300'
                }`}
            />
        </div>
    );

    return (
        <div className="w-full h-full bg-white flex flex-col overflow-y-auto relative font-poppins">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute inset-0 opacity-[0.14] transition-colors duration-700 ease-in-out"
                    style={{
                        background: `radial-gradient(120% 60% at 50% 0%, ${
                            step === 'celebrate' ? '#3B82F6' : '#10B981'
                        } 0%, transparent 60%)`,
                    }}
                />
            </div>

            {step === 'age-country' && (
                <div className="relative z-10 w-full h-full flex flex-col">
                    <div className="flex-1 flex flex-col justify-center items-center px-4 pt-[calc(env(safe-area-inset-top)_+_2rem)] pb-8">
                        <div className="w-full max-w-[420px] animate-fade-in-up">
                            {renderProgress(1)}

                            <div className="text-center mb-8">
                                <div className="w-16 h-16 mx-auto mb-4 bg-emerald-50 rounded-full flex items-center justify-center shadow-sm border border-emerald-100/50">
                                    <ShieldCheck
                                        className="w-8 h-8 text-emerald-600"
                                        strokeWidth={1.5}
                                    />
                                </div>
                                <h1 className="text-2xl font-semibold text-grayscale-900 mb-2">
                                    Welcome — let's set you up
                                </h1>
                                <p className="text-sm text-grayscale-600 leading-relaxed">
                                    Just a couple quick things to personalize {brandName} and keep
                                    you safe.
                                </p>
                            </div>

                            {error && (
                                <div className="mb-6 p-3 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-2xl shadow-sm">
                                    <span className="text-sm text-red-700 leading-relaxed">
                                        {error}
                                    </span>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                                        Date of Birth
                                    </label>
                                    <BirthdayPicker
                                        value={dob}
                                        onChange={setDob}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                                        Country
                                    </label>
                                    <button
                                        className="w-full flex items-center justify-between bg-white/80 backdrop-blur-sm text-grayscale-900 rounded-2xl font-medium px-4 py-4 text-sm border border-grayscale-200/60 shadow-sm motion-safe:hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                                        onClick={() => {
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
                                                    desktop: ModalTypes.Cancel,
                                                    mobile: ModalTypes.Cancel,
                                                }
                                            );
                                        }}
                                        type="button"
                                    >
                                        {country ? COUNTRIES[country] ?? country : 'Select country'}
                                        <LocationIcon className="w-5 h-5 text-grayscale-500" />
                                    </button>
                                </div>

                                {needsUSConsent && (
                                    <div className="mt-4 p-4 bg-white/80 backdrop-blur-sm border border-grayscale-200/60 rounded-2xl space-y-3 animate-fade-in-up shadow-sm">
                                        <h3 className="text-sm font-semibold text-grayscale-900">
                                            Parental Notice
                                        </h3>
                                        <p className="text-xs text-grayscale-600 leading-relaxed">
                                            Because you are under 18, we need your parent or
                                            guardian's permission to collect your information. By
                                            continuing, you confirm you have their permission.
                                        </p>
                                        <label className="flex items-start gap-3 cursor-pointer mt-2 group">
                                            <input
                                                type="checkbox"
                                                checked={usMinorConsent}
                                                onChange={e => setUsMinorConsent(e.target.checked)}
                                                className="mt-0.5 w-4 h-4 rounded border-grayscale-300 text-emerald-600 focus:ring-emerald-500 transition-colors"
                                            />
                                            <span className="text-xs font-medium text-grayscale-700 group-hover:text-grayscale-900 transition-colors">
                                                I have my parent/guardian's permission
                                            </span>
                                        </label>
                                    </div>
                                )}

                                {needsEUConsent && (
                                    <div className="mt-4 p-4 bg-white/80 backdrop-blur-sm border border-grayscale-200/60 rounded-2xl space-y-3 animate-fade-in-up shadow-sm">
                                        <h3 className="text-sm font-semibold text-grayscale-900">
                                            Parental Consent Required
                                        </h3>
                                        <p className="text-xs text-grayscale-600 leading-relaxed">
                                            Because of privacy laws in your country, we need your
                                            parent or guardian's permission to create your account.
                                        </p>
                                        <div>
                                            <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                                                Parent/Guardian Email
                                            </label>
                                            <input
                                                type="email"
                                                value={guardianEmail}
                                                onChange={e => setGuardianEmail(e.target.value)}
                                                placeholder="guardian@example.com"
                                                className="w-full py-3 px-4 border border-grayscale-200/60 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/50 transition-all"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="w-full bg-white/70 backdrop-blur-xl border-t border-grayscale-200/60 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)_+_1.5rem)]">
                        <div className="max-w-[420px] mx-auto">
                            <button
                                type="button"
                                onClick={handleScreen1Continue}
                                disabled={isPreparingKey || !canContinueScreen1}
                                className="w-full py-3.5 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-base hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md active:scale-[0.98]"
                            >
                                {isPreparingKey ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    'Continue'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {step === 'profile' && (
                <div className="relative z-10 w-full h-full flex flex-col">
                    <div className="flex-1 flex flex-col items-center desktop:justify-center px-4 pt-[calc(env(safe-area-inset-top)_+_2rem)] pb-8 overflow-y-auto">
                        <div className="w-full max-w-[420px] desktop:max-w-[900px] animate-fade-in-up">
                            {renderProgress(2)}

                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-semibold text-grayscale-900 mb-2">
                                    Make it yours
                                </h1>
                                <p className="text-sm text-grayscale-600">
                                    Customize how you appear on the network.
                                </p>
                            </div>

                            {error && (
                                <div className="mb-6 p-3 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-2xl shadow-sm">
                                    <span className="text-sm text-red-700 leading-relaxed">
                                        {error}
                                    </span>
                                </div>
                            )}

                            <div className="flex flex-col desktop:grid desktop:grid-cols-2 desktop:gap-10 desktop:items-center items-center space-y-5 desktop:space-y-0">
                                {/* LEFT COLUMN: Hero Card Preview */}
                                <div className="w-full flex justify-center">
                                    <div className="w-full max-w-[320px] bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 p-6 pt-8 flex flex-col items-center gap-3 relative overflow-hidden group transition-all duration-300 hover:shadow-2xl">
                                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/15 via-emerald-50/5 to-transparent pointer-events-none" />
                                        <div className="absolute top-4 left-5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700/50">
                                            {brandName}
                                        </div>
                                        <div className="relative">
                                            <div className="relative flex justify-center items-center h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-grayscale-100 transition-transform duration-300 group-hover:scale-105">
                                                {photo ? (
                                                    <img
                                                        src={photo}
                                                        alt=""
                                                        className="w-full h-full object-cover rounded-full"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-semibold text-3xl">
                                                        {(
                                                            name?.trim()?.[0] ||
                                                            profileId?.trim()?.[0] ||
                                                            ''
                                                        ).toUpperCase() || (
                                                            <User
                                                                className="w-1/2 h-1/2 opacity-90"
                                                                strokeWidth={1.75}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                                {imageUploadLoading && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={handleImageSelect}
                                                className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border border-grayscale-200 text-grayscale-700 hover:bg-grayscale-50 transition-colors active:scale-95"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="text-center relative z-10 w-full">
                                            <h2 className="text-xl font-semibold text-grayscale-900 truncate px-2">
                                                {name || 'Your Name'}
                                            </h2>
                                            <p className="text-sm text-grayscale-500 font-medium truncate px-2">
                                                @{profileId || 'username'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: Profile Card + Privacy Card */}
                                <div className="w-full flex flex-col space-y-5">
                                    <div className="w-full bg-white/80 backdrop-blur-sm border border-grayscale-200/60 rounded-3xl shadow-sm p-5 space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                                                Full Name
                                            </label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                placeholder="Your Name"
                                                className="w-full py-3 px-4 border border-grayscale-200/60 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/50 transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                                                Public Handle
                                            </label>
                                            <div
                                                className={`flex items-center w-full border rounded-xl bg-white/50 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all ${
                                                    profileIdError
                                                        ? 'border-red-300'
                                                        : 'border-grayscale-200/60'
                                                }`}
                                            >
                                                <span className="pl-4 text-grayscale-400 font-medium">
                                                    @
                                                </span>
                                                <input
                                                    type="text"
                                                    value={profileId}
                                                    onChange={e => {
                                                        setIsHandleManuallyEdited(true);
                                                        setProfileId(e.target.value);
                                                        setProfileIdError('');
                                                    }}
                                                    placeholder="username"
                                                    className="flex-1 py-3 px-2 text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none bg-transparent"
                                                />
                                                <div className="pr-4 flex items-center">
                                                    {uniqueProfileFetching && (
                                                        <Loader2 className="w-4 h-4 text-grayscale-400 animate-spin" />
                                                    )}
                                                    {!uniqueProfileFetching &&
                                                        isUniqueValid &&
                                                        isLengthValid &&
                                                        isFormatValid && (
                                                            <Check className="w-4 h-4 text-emerald-500" />
                                                        )}
                                                </div>
                                            </div>
                                            {profileIdError && (
                                                <p className="mt-1.5 text-xs text-red-600">
                                                    {profileIdError}
                                                </p>
                                            )}
                                            {profileId &&
                                            !isCreating &&
                                            !(
                                                isLengthValid &&
                                                isFormatValid &&
                                                isUniqueValid &&
                                                !uniqueProfileFetching
                                            ) ? (
                                                <div className="mt-2 space-y-1">
                                                    <div
                                                        className={`flex items-center gap-1.5 text-xs transition-colors ${
                                                            isLengthValid
                                                                ? 'text-emerald-600'
                                                                : 'text-grayscale-400'
                                                        }`}
                                                    >
                                                        {isLengthValid ? (
                                                            <Check className="w-3.5 h-3.5 shrink-0" />
                                                        ) : (
                                                            <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-grayscale-300" />
                                                            </span>
                                                        )}
                                                        3–25 characters
                                                    </div>
                                                    <div
                                                        className={`flex items-center gap-1.5 text-xs transition-colors ${
                                                            isFormatValid
                                                                ? 'text-emerald-600'
                                                                : 'text-grayscale-400'
                                                        }`}
                                                    >
                                                        {isFormatValid ? (
                                                            <Check className="w-3.5 h-3.5 shrink-0" />
                                                        ) : (
                                                            <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-grayscale-300" />
                                                            </span>
                                                        )}
                                                        Letters, numbers, and dashes only
                                                    </div>
                                                    <div
                                                        className={`flex items-center gap-1.5 text-xs transition-colors ${
                                                            !uniqueProfileFetching && isUniqueValid
                                                                ? 'text-emerald-600'
                                                                : 'text-grayscale-400'
                                                        }`}
                                                    >
                                                        {uniqueProfileFetching ? (
                                                            <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                                                        ) : isUniqueValid ? (
                                                            <Check className="w-3.5 h-3.5 shrink-0" />
                                                        ) : (
                                                            <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-grayscale-300" />
                                                            </span>
                                                        )}
                                                        {uniqueProfileFetching
                                                            ? 'Checking availability…'
                                                            : isUniqueValid
                                                            ? 'Available'
                                                            : 'Already taken'}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="mt-1.5 text-xs text-grayscale-500">
                                                    Friends can find you with this.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="w-full p-5 bg-white/80 backdrop-blur-sm border border-grayscale-200/60 rounded-3xl shadow-sm space-y-5">
                                        <div>
                                            <h3 className="text-sm font-semibold text-grayscale-900">
                                                Your Privacy
                                            </h3>
                                            <p className="text-xs text-grayscale-500 mt-0.5">
                                                Set based on your age. Change anytime in Settings.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-grayscale-700">
                                                    {brandName} AI
                                                </span>
                                                <Toggle
                                                    checked={Boolean(
                                                        privacyPreferences?.aiEnabled &&
                                                            !privacyPreferences?.isMinor
                                                    )}
                                                    disabled={privacyPreferences?.isMinor}
                                                    onChange={() =>
                                                        setPrivacyPreferences(prev =>
                                                            prev
                                                                ? {
                                                                      ...prev,
                                                                      aiEnabled: !prev.aiEnabled,
                                                                  }
                                                                : prev
                                                        )
                                                    }
                                                />
                                            </div>
                                            {privacyPreferences?.isMinor && (
                                                <p className="text-xs text-amber-700 bg-amber-50/80 backdrop-blur-sm p-2.5 rounded-xl border border-amber-100/50">
                                                    AI features are disabled for minors.
                                                </p>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-grayscale-700">
                                                    Analytics
                                                </span>
                                                <Toggle
                                                    checked={Boolean(
                                                        privacyPreferences?.analyticsEnabled
                                                    )}
                                                    onChange={() =>
                                                        setPrivacyPreferences(prev =>
                                                            prev
                                                                ? {
                                                                      ...prev,
                                                                      analyticsEnabled:
                                                                          !prev.analyticsEnabled,
                                                                  }
                                                                : prev
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-grayscale-700">
                                                    Bug Reports
                                                </span>
                                                <Toggle
                                                    checked={Boolean(
                                                        privacyPreferences?.bugReportsEnabled
                                                    )}
                                                    onChange={() =>
                                                        setPrivacyPreferences(prev =>
                                                            prev
                                                                ? {
                                                                      ...prev,
                                                                      bugReportsEnabled:
                                                                          !prev.bugReportsEnabled,
                                                                  }
                                                                : prev
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full bg-white/70 backdrop-blur-xl border-t border-grayscale-200/60 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)_+_1.5rem)]">
                        <div className="max-w-[420px] mx-auto">
                            <button
                                type="button"
                                onClick={handleCreateProfile}
                                disabled={
                                    isCreating ||
                                    !name ||
                                    !profileId ||
                                    !isUniqueValid ||
                                    !isLengthValid ||
                                    !isFormatValid ||
                                    uniqueProfileFetching
                                }
                                className="w-full py-3.5 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-base hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md active:scale-[0.98]"
                            >
                                {isCreating ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    `Create my ${brandName}`
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {step === 'celebrate' && (
                <div className="relative z-10 max-w-[600px] mx-auto pt-[calc(env(safe-area-inset-top)_+_2.5rem)] px-4 w-full h-full flex flex-col justify-center items-center animate-pop-in pb-[calc(env(safe-area-inset-bottom)_+_1.5rem)]">
                    <Confetti />

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-semibold text-grayscale-900 mb-2">
                            You're in!
                        </h1>
                        <p className="text-base text-grayscale-600">Your {brandName} is ready.</p>
                    </div>

                    <div className="w-full max-w-[320px] bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 p-8 flex flex-col items-center gap-5 relative overflow-hidden mb-10">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-50" />
                        <div className="relative flex justify-center items-center h-28 w-28 rounded-full overflow-hidden border-4 border-white shadow-md bg-grayscale-100 z-10">
                            {photo ? (
                                <img
                                    src={photo}
                                    alt=""
                                    className="w-full h-full object-cover rounded-full"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-semibold text-4xl">
                                    {(
                                        name?.trim()?.[0] ||
                                        profileId?.trim()?.[0] ||
                                        ''
                                    ).toUpperCase() || (
                                        <User
                                            className="w-1/2 h-1/2 opacity-90"
                                            strokeWidth={1.75}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="text-center relative z-10 w-full">
                            <h2 className="text-2xl font-semibold text-grayscale-900 truncate px-2">
                                {name}
                            </h2>
                            <p className="text-base text-grayscale-500 font-medium truncate px-2">
                                @{profileId}
                            </p>
                        </div>
                    </div>

                    <div className="w-full max-w-sm space-y-4 mb-8">
                        <p className="text-sm font-medium text-grayscale-700 text-center">
                            Who are you? (Optional)
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {LearnCardRoles.map(r => (
                                <button
                                    key={r.type}
                                    onClick={() => handleRoleSelect(r.type)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all motion-safe:hover:-translate-y-0.5 active:scale-[0.97] shadow-sm ${
                                        role === r.type
                                            ? 'bg-grayscale-900 text-white shadow-md'
                                            : 'bg-grayscale-100 border border-grayscale-200 text-grayscale-700 hover:bg-grayscale-200'
                                    }`}
                                >
                                    {r.title}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-full max-w-sm mt-2">
                        <button
                            type="button"
                            onClick={handleExplore}
                            className="w-full py-3.5 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-base hover:opacity-90 transition-all shadow-md active:scale-[0.98]"
                        >
                            Explore {brandName}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OnboardingFlow;
