import React, { useState, useEffect, useCallback, useRef } from 'react';

import { ModalTypes, useModal } from 'learn-card-base';
import { calculateAge, isFutureDate } from 'learn-card-base/helpers/dateHelpers';
import { getSigningLearnCard } from 'learn-card-base/helpers/walletHelpers';
import { generateEd25519PrivateKey } from '@learncard/sss-key-manager';

import OnboardingRoles from './onboardingRoles/OnboardingRoles';
import OnboardingFooter from './onboardingFooter/OnboardingFooter';
import OnboardingHeader from './onboardingHeader/OnboardingHeader';
import OnboardingNetworkForm from './onboardingNetworkForm/OnboardingNetworkForm';
import OnboardingAgeGate from './OnboardingAgeGate';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { useGetProfile } from 'learn-card-base';
import redirectStore from 'learn-card-base/stores/redirectStore';

import { useAppAuth } from '../../providers/AuthCoordinatorProvider';
import useLogout from '../../hooks/useLogout';

import { LearnCardRolesEnum, OnboardingStepsEnum } from './onboarding.helpers';
import { isEUCountry, requiresEUParentalConsent } from './onboardingNetworkForm/helpers/gdpr';
import { ONBOARDING_STARTED_AT_KEY } from '@analytics';
import UnderageModalContent from './onboardingNetworkForm/components/UnderageModalContent';
import EUParentalConsentModalContent from './onboardingNetworkForm/components/EUParentalConsentModalContent';
import USConsentNoticeModalContent from './onboardingNetworkForm/components/USConsentNoticeModalContent';

type OnboardingContainerProps = {
    onSuccess?: () => void;
    initialStep?: OnboardingStepsEnum;
};

const OnboardingContainer: React.FC<OnboardingContainerProps> = ({ onSuccess, initialStep }) => {
    const { newModal, closeModal } = useModal();
    const { state: coordinatorState, setupNewKey } = useAppAuth();
    const { handleLogout } = useLogout();
    const [role, setRole] = useState<LearnCardRolesEnum>(LearnCardRolesEnum.learner);

    const [ageGateError, setAgeGateError] = useState<string | null>(null);
    const [isPreparingKey, setIsPreparingKey] = useState(false);
    const didPrepareNewKeyRef = useRef(false);
    const prepareNewKeyPromiseRef = useRef<Promise<boolean> | null>(null);

    const currentUser = useCurrentUser();
    const { data: currentLCNUser, isLoading: currentLCNUserLoading } = useGetProfile();
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
        }));
    }, [currentLCNUser, currentLCNUserCountry, currentLCNUserDob, currentUser?.profileImage]);

    const hasProfileAgeData = Boolean(currentLCNUserDob && currentLCNUserCountry);
    const shouldStartAtAgeGate =
        coordinatorState.status === 'needs_setup' || (!currentLCNUserLoading && !hasProfileAgeData);

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

        if (!currentLCNUser) {
            return;
        }

        if (!currentLCNUserDob || !currentLCNUserCountry) {
            setStep(OnboardingStepsEnum.ageGate);
        }
    }, [coordinatorState.status, currentLCNUserCountry, currentLCNUserDob, currentLCNUserLoading]);

    useEffect(() => {
        // Set flag so AppListingPage's auto-trigger waits until onboarding closes
        redirectStore.set.isOnboardingOpen(true);

        // LC-1853 (review #8): stamp the onboarding-entry timestamp at the very
        // first onboarding screen (this container, which renders selectRole
        // before the network form) so ONBOARDING_COMPLETED.msSinceMethodStarted
        // reports time-in-flow rather than time-on-final-form. Set only if not
        // already set, so a back-and-forth between steps doesn't reset it.
        if (!localStorage.getItem(ONBOARDING_STARTED_AT_KEY)) {
            localStorage.setItem(ONBOARDING_STARTED_AT_KEY, String(Date.now()));
        }

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
    }, [coordinatorState.status, deriveDidFromPrivateKey, setupNewKey]);

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
                setStep(OnboardingStepsEnum.selectRole);
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
    }, [closeModal, newModal, prepareNewUserKey, routeChildToParentFlow]);

    const presentUSConsentNoticeModal = useCallback(() => {
        newModal(
            <USConsentNoticeModalContent
                onBack={closeModal}
                onContinue={async () => {
                    updateFormData({ usMinorConsent: true });
                    closeModal();
                    if (await prepareNewUserKey()) {
                        setStep(OnboardingStepsEnum.selectRole);
                    }
                }}
            />,
            {
                sectionClassName:
                    '!bg-transparent !border-none !shadow-none !rounded-none !mx-auto',
            },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    }, [closeModal, newModal, prepareNewUserKey]);

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
                        setStep(OnboardingStepsEnum.selectRole);
                    }
                }}
            />,
            {
                sectionClassName:
                    '!bg-transparent !border-none !shadow-none !rounded-none !mx-auto',
            },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    }, [closeModal, formData.country, formData.dob, formData.name, newModal, prepareNewUserKey]);

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
            setStep(OnboardingStepsEnum.selectRole);
        }
    }, [
        formData,
        prepareNewUserKey,
        presentEUParentalConsentModal,
        presentUnderageModal,
        presentUSConsentNoticeModal,
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
                    updateFormData({
                        dob,
                        usMinorConsent: false,
                        euParentalConsentRequested: false,
                    });
                }}
                onCountryChange={country => {
                    setAgeGateError(null);
                    updateFormData({
                        country,
                        usMinorConsent: false,
                        euParentalConsentRequested: false,
                    });
                }}
                onContinue={handleAgeGateContinue}
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
                <OnboardingHeader text="Select what best describes you!" />
                <OnboardingRoles role={role} setRole={setRole} />
                <OnboardingFooter
                    overrideSkip={
                        step === OnboardingStepsEnum.selectRole
                            ? () => setStep(OnboardingStepsEnum.joinNetwork)
                            : undefined
                    }
                    step={step}
                    role={role}
                    setStep={setStep}
                />
            </div>
        </div>
    );
};

export default OnboardingContainer;
