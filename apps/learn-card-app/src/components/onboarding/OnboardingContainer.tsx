import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as m from '../../paraglide/messages.js';
import { TransP } from '../../i18n/TransP';

import { ModalTypes, useModal, useGetProfile, useUpdatePreferences } from 'learn-card-base';
import { calculateAge, isFutureDate } from 'learn-card-base/helpers/dateHelpers';
import { getSigningLearnCard } from 'learn-card-base/helpers/walletHelpers';
import { generateEd25519PrivateKey } from '@learncard/sss-key-manager';

import OnboardingRoles from './onboardingRoles/OnboardingRoles';
import OnboardingFooter from './onboardingFooter/OnboardingFooter';
import OnboardingHeader from './onboardingHeader/OnboardingHeader';
import OnboardingNetworkForm from './onboardingNetworkForm/OnboardingNetworkForm';
import OnboardingAgeGate from './OnboardingAgeGate';
import OnboardingPrivacyDataStep from './OnboardingPrivacyDataStep';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import redirectStore from 'learn-card-base/stores/redirectStore';

import { useAppAuth } from '../../providers/AuthCoordinatorProvider';
import useLogout from '../../hooks/useLogout';

import { LearnCardRolesEnum, OnboardingStepsEnum } from './onboarding.helpers';
import { isEUCountry, requiresEUParentalConsent } from './onboardingNetworkForm/helpers/gdpr';
import { ONBOARDING_STARTED_AT_KEY, useAnalytics } from '@analytics';
import UnderageModalContent from './onboardingNetworkForm/components/UnderageModalContent';
import EUParentalConsentModalContent from './onboardingNetworkForm/components/EUParentalConsentModalContent';
import USConsentNoticeModalContent from './onboardingNetworkForm/components/USConsentNoticeModalContent';
import { getDefaultPrivacyPreferences } from './privacyPreferences';
import type { OnboardingPrivacyPreferences } from './privacyPreferences';

type OnboardingContainerProps = {
    onSuccess?: () => void;
    initialStep?: OnboardingStepsEnum;
};

const OnboardingContainer: React.FC<OnboardingContainerProps> = ({ onSuccess, initialStep }) => {
    const { newModal, closeModal } = useModal();
    const { state: coordinatorState, setupNewKey } = useAppAuth();
    const { mutateAsync: updatePreferences } = useUpdatePreferences();
    const { setEnabled: setAnalyticsEnabled } = useAnalytics();
    const { handleLogout } = useLogout();
    const [role, setRole] = useState<LearnCardRolesEnum>(LearnCardRolesEnum.learner);

    const [ageGateError, setAgeGateError] = useState<string | null>(null);
    const [privacyStepError, setPrivacyStepError] = useState<string | null>(null);
    const [isPreparingKey, setIsPreparingKey] = useState(false);
    const [isSavingPrivacyPreferences, setIsSavingPrivacyPreferences] = useState(false);
    const didPrepareNewKeyRef = useRef(false);
    const prepareNewKeyPromiseRef = useRef<Promise<boolean> | null>(null);

    const currentUser = useCurrentUser();
    const {
        data: currentLCNUser,
        isLoading: currentLCNUserLoading,
        isError: currentLCNUserError,
    } = useGetProfile();
    const currentLCNUserDob =
        currentLCNUser && 'dob' in currentLCNUser ? currentLCNUser.dob ?? '' : '';
    const currentLCNUserCountry =
        currentLCNUser && 'country' in currentLCNUser ? currentLCNUser.country : undefined;
    const [formData, setFormData] = useState<
        React.ComponentProps<typeof OnboardingNetworkForm>['formData']
    >({
        name: currentLCNUser?.displayName ?? currentUser?.name ?? '',
        dob: currentLCNUserDob,
        country: currentLCNUserCountry,
        photo: currentLCNUser?.image ?? currentUser?.profileImage ?? '',
        usMinorConsent: false,
        euParentalConsentRequested: false,
        guardianEmail: '',
        profileId: '',
        privacyPreferences:
            currentLCNUserDob && currentLCNUserCountry
                ? getDefaultPrivacyPreferences(currentLCNUserDob, currentLCNUserCountry)
                : undefined,
    });

    useEffect(() => {
        if (!currentLCNUser) {
            return;
        }

        setFormData(prev => ({
            ...prev,
            name: prev.name || currentLCNUser.displayName || prev.name,
            dob: prev.dob || currentLCNUserDob || '',
            country: prev.country || currentLCNUserCountry,
            photo: prev.photo || currentLCNUser.image || currentUser?.profileImage || '',
            privacyPreferences:
                prev.privacyPreferences ||
                (currentLCNUserDob && currentLCNUserCountry
                    ? getDefaultPrivacyPreferences(currentLCNUserDob, currentLCNUserCountry)
                    : prev.privacyPreferences),
        }));
    }, [currentLCNUser, currentLCNUserCountry, currentLCNUserDob, currentUser?.profileImage]);

    const hasProfileAgeData = Boolean(currentLCNUserDob && currentLCNUserCountry);
    // An errored profile fetch must count as "still resolving", not "no age data" —
    // otherwise a transient wallet/network failure would drop an existing user onto
    // the age gate. New users are routed via `needs_setup`, which is unaffected.
    const profileResolving = currentLCNUserLoading || currentLCNUserError;
    const shouldStartAtAgeGate =
        coordinatorState.status === 'needs_setup' || (!profileResolving && !hasProfileAgeData);

    const [step, setStep] = useState<OnboardingStepsEnum>(
        shouldStartAtAgeGate
            ? OnboardingStepsEnum.ageGate
            : initialStep ?? OnboardingStepsEnum.selectRole
    );

    const [pendingInstall, setPendingInstall] = useState<{
        listingId: string;
        appName: string;
        appIcon?: string;
    } | null>(null);

    useEffect(() => {
        if (coordinatorState.status === 'needs_setup' && !didPrepareNewKeyRef.current) {
            setStep(OnboardingStepsEnum.ageGate);
        }
    }, [coordinatorState.status]);

    useEffect(() => {
        if (coordinatorState.status === 'needs_setup' || currentLCNUserLoading) {
            return;
        }

        if (didPrepareNewKeyRef.current) {
            return;
        }

        if (!currentLCNUser) {
            return;
        }

        if (!currentLCNUserDob || !currentLCNUserCountry) {
            setStep(OnboardingStepsEnum.ageGate);
        }
    }, [coordinatorState.status, currentLCNUserCountry, currentLCNUserDob, currentLCNUserLoading]);

    useEffect(() => {
        // Set the open flag eagerly; this container's unmount cleanup owns the reset.
        // This also keeps AppListingPage's auto-trigger from firing while onboarding is active.
        redirectStore.set.isOnboardingOpen(true);

        // Claim installIntent — must happen after setting isOnboardingOpen
        const intent = redirectStore.get.installIntent();
        if (intent?.listingId) {
            setPendingInstall({
                listingId: intent.listingId,
                appName: intent.appName,
                appIcon: intent.appIcon,
            });
            redirectStore.set.installIntent(null);
        }

        return () => {
            redirectStore.set.isOnboardingOpen(false);
        };
    }, []);

    const updateFormData = (updates: Partial<typeof formData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const advanceToPrivacyStep = useCallback(() => {
        if (!formData.dob || !formData.country) {
            return;
        }

        setPrivacyStepError(null);
        setFormData(prev => ({
            ...prev,
            privacyPreferences:
                prev.privacyPreferences ??
                getDefaultPrivacyPreferences(formData.dob ?? '', formData.country),
        }));
        setStep(OnboardingStepsEnum.privacyData);
    }, [formData.country, formData.dob]);

    const updateFormDataForChild: React.ComponentProps<
        typeof OnboardingNetworkForm
    >['updateFormData'] = updates => {
        updateFormData(updates as Partial<typeof formData>);
    };

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

            setAgeGateError('Something went wrong. Please sign in again.');
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

                if (!did) {
                    throw new Error('Failed to derive account identity');
                }

                await setupNewKey(privateKey, did);
                didPrepareNewKeyRef.current = true;
                return true;
            } catch (e) {
                setAgeGateError('Something went wrong. Please try again.');
                console.error('Failed to prepare new user key:', e);
                return false;
            } finally {
                setIsPreparingKey(false);
                prepareNewKeyPromiseRef.current = null;
            }
        })();

        prepareNewKeyPromiseRef.current = preparePromise;
        return preparePromise;
    }, [coordinatorState.status, currentUser?.privateKey, deriveDidFromPrivateKey, setupNewKey]);

    const routeChildToParentFlow = useCallback(() => {
        closeModal();
        // The child is logged out here; LoginPage's `redirectTo` query handling sends the
        // guardian to family creation once they log in. (No `underageFamily` flag — that
        // triggered a second logout that bounced the freshly-logged-in guardian.)
        handleLogout({
            overrideRedirectUrl: '/login?redirectTo=%2Ffamilies%3FcreateFamily%3Dtrue',
        });
    }, [closeModal, handleLogout]);

    const presentUnderageModal = useCallback(() => {
        const onBypass = async (_code: string) => {
            closeModal();
            setAgeGateError(null);

            if (await prepareNewUserKey()) {
                advanceToPrivacyStep();
            }
        };

        const familyInviteUrl = `${window.location.origin}/login?redirectTo=${encodeURIComponent(
            '/families?createFamily=true'
        )}`;

        newModal(
            <UnderageModalContent
                onBack={closeModal}
                onAdult={routeChildToParentFlow}
                isLoggingOut={false}
                schoolCodes={[]}
                onBypass={onBypass}
                familyInviteUrl={familyInviteUrl}
            />,
            {
                sectionClassName:
                    '!bg-transparent !border-none !shadow-none !rounded-none p-[20px] !mx-auto',
            },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    }, [advanceToPrivacyStep, closeModal, newModal, prepareNewUserKey, routeChildToParentFlow]);

    const presentUSConsentNoticeModal = useCallback(() => {
        newModal(
            <USConsentNoticeModalContent
                onBack={closeModal}
                onContinue={async () => {
                    updateFormData({ usMinorConsent: true });
                    closeModal();
                    if (await prepareNewUserKey()) {
                        advanceToPrivacyStep();
                    }
                }}
            />,
            {
                sectionClassName:
                    '!bg-transparent !border-none !shadow-none !rounded-none !mx-auto',
            },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    }, [advanceToPrivacyStep, closeModal, newModal, prepareNewUserKey, updateFormData]);

    const presentEUParentalConsentModal = useCallback(() => {
        newModal(
            <EUParentalConsentModalContent
                name={formData.name}
                dob={formData.dob}
                country={formData.country}
                onClose={closeModal}
                onSubmit={guardianEmail => {
                    // Defer the actual send — the profile this approval is keyed to doesn't
                    // exist yet. OnboardingNetworkForm sends it after createProfile.
                    updateFormData({ euParentalConsentRequested: true, guardianEmail });
                }}
                onComplete={async () => {
                    closeModal();
                    if (await prepareNewUserKey()) {
                        advanceToPrivacyStep();
                    }
                }}
            />,
            {
                sectionClassName:
                    '!bg-transparent !border-none !shadow-none !rounded-none !mx-auto',
            },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    }, [
        advanceToPrivacyStep,
        closeModal,
        formData.country,
        formData.dob,
        formData.name,
        newModal,
        prepareNewUserKey,
        updateFormData,
    ]);

    const handleAgeGateContinue = useCallback(async () => {
        const { dob, country } = formData;

        if (!dob) {
            setAgeGateError('Date of birth is required.');
            return;
        }

        if (!country) {
            setAgeGateError('Country is required.');
            return;
        }

        if (isFutureDate(dob)) {
            setAgeGateError('Date of birth cannot be in the future.');
            return;
        }

        const age = calculateAge(dob);

        if (Number.isNaN(age)) {
            setAgeGateError('Please enter a valid date of birth.');
            return;
        }

        setAgeGateError(null);

        if (age < 13) {
            presentUnderageModal();
            return;
        }

        if (age >= 13 && age <= 17) {
            if (isEUCountry(country) && requiresEUParentalConsent(country, age)) {
                presentEUParentalConsentModal();
                return;
            }

            if (!isEUCountry(country)) {
                presentUSConsentNoticeModal();
                return;
            }
        }

        if (await prepareNewUserKey()) {
            advanceToPrivacyStep();
        }
    }, [
        advanceToPrivacyStep,
        formData,
        prepareNewUserKey,
        presentEUParentalConsentModal,
        presentUnderageModal,
        presentUSConsentNoticeModal,
    ]);

    const handlePrivacyPreferencesContinue = useCallback(async () => {
        const selectedPreferences =
            formData.privacyPreferences ??
            getDefaultPrivacyPreferences(formData.dob ?? '', formData.country);
        const preferencesToSave: OnboardingPrivacyPreferences = {
            ...selectedPreferences,
            aiEnabled: selectedPreferences.isMinor ? false : selectedPreferences.aiEnabled,
            aiAutoDisabled: selectedPreferences.isMinor,
            analyticsAutoDisabled: false,
        };

        setPrivacyStepError(null);
        setIsSavingPrivacyPreferences(true);

        try {
            await updatePreferences(preferencesToSave);
            setAnalyticsEnabled(preferencesToSave.analyticsEnabled);
            updateFormData({
                privacyPreferences: preferencesToSave,
            });
            setStep(OnboardingStepsEnum.selectRole);
        } catch {
            setPrivacyStepError('Something went wrong. Please try again.');
        } finally {
            setIsSavingPrivacyPreferences(false);
        }
    }, [
        formData.country,
        formData.dob,
        formData.privacyPreferences,
        setAnalyticsEnabled,
        updateFormData,
        updatePreferences,
    ]);

    if (step === OnboardingStepsEnum.ageGate) {
        return (
            <OnboardingAgeGate
                dob={formData.dob ?? ''}
                country={formData.country}
                error={ageGateError}
                isLoading={isPreparingKey}
                onDobChange={dob => {
                    setAgeGateError(null);
                    setPrivacyStepError(null);
                    updateFormData({
                        dob,
                        usMinorConsent: false,
                        euParentalConsentRequested: false,
                        privacyPreferences: undefined,
                    });
                }}
                onCountryChange={country => {
                    setAgeGateError(null);
                    setPrivacyStepError(null);
                    updateFormData({
                        country,
                        usMinorConsent: false,
                        euParentalConsentRequested: false,
                        privacyPreferences: undefined,
                    });
                }}
                onContinue={handleAgeGateContinue}
            />
        );
    }

    if (step === OnboardingStepsEnum.privacyData) {
        return (
            <OnboardingPrivacyDataStep
                preferences={
                    formData.privacyPreferences ??
                    getDefaultPrivacyPreferences(formData.dob ?? '', formData.country)
                }
                error={privacyStepError}
                isLoading={isSavingPrivacyPreferences}
                onBack={() => {
                    setPrivacyStepError(null);
                    setStep(OnboardingStepsEnum.ageGate);
                }}
                onChange={updates => {
                    setPrivacyStepError(null);
                    updateFormData({
                        privacyPreferences: {
                            ...(formData.privacyPreferences ??
                                getDefaultPrivacyPreferences(formData.dob ?? '', formData.country)),
                            ...updates,
                        },
                    });
                }}
                onContinue={handlePrivacyPreferencesContinue}
            />
        );
    }

    if (step === OnboardingStepsEnum.joinNetwork) {
        return (
            <OnboardingNetworkForm
                handleCloseModal={() => closeModal()}
                containerClassName="!pt-2"
                step={step}
                role={role}
                setStep={setStep}
                onSuccess={onSuccess}
                formData={formData}
                updateFormData={updateFormData}
                skipRoleSlides={pendingInstall !== null}
                pendingInstall={pendingInstall}
            />
        );
    }

    return (
        <div className="w-full h-full bg-white flex flex-col overflow-y-auto relative">
            <div className="max-w-[600px] mx-auto pt-[50px] px-4 pb-[16px] relative w-full">
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
                            <TransP
                                m={m['onboarding.profile.installBanner']}
                                values={{ appName: pendingInstall.appName }}
                                components={[<span className="font-semibold" key="a" />]}
                            />
                        </p>
                    </div>
                )}
                <OnboardingHeader text={m['onboarding.selectRole.header']()} />
                <OnboardingRoles role={role} setRole={setRole} />
            </div>

            <OnboardingFooter
                overrideSkip={
                    step === OnboardingStepsEnum.selectRole
                        ? () => setStep(OnboardingStepsEnum.joinNetwork)
                        : undefined
                }
                step={step}
                role={role}
                setStep={setStep}
                showBackButton
            />
        </div>
    );
};

export default OnboardingContainer;
