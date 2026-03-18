import React, { useState, useEffect } from 'react';

import OnboardingRoles from './onboardingRoles/OnboardingRoles';
import OnboardingFooter from './onboardingFooter/OnboardingFooter';
import OnboardingHeader from './onboardingHeader/OnboardingHeader';
import OnboardingNetworkForm from './onboardingNetworkForm/OnboardingNetworkForm';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { useModal } from 'learn-card-base';
import redirectStore from 'learn-card-base/stores/redirectStore';

import { LearnCardRolesEnum, OnboardingStepsEnum } from './onboarding.helpers';

const OnboardingContainer: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
    const { closeModal } = useModal();
    const [role, setRole] = useState<LearnCardRolesEnum | null>(LearnCardRolesEnum.learner);

    const [step, setStep] = useState<OnboardingStepsEnum>(OnboardingStepsEnum.selectRole);

    const currentUser = useCurrentUser();
    const [formData, setFormData] = useState({
        name: currentUser?.name ?? '',
        dob: '',
        country: undefined as string | undefined,
        photo: currentUser?.profileImage ?? '',
        usMinorConsent: false,
        profileId: '',
    });

    const [pendingInstall, setPendingInstall] = useState<{
        listingId: string;
        appName: string;
    } | null>(null);

    useEffect(() => {
        // Set flag so AppListingPage's auto-trigger waits until onboarding closes
        redirectStore.set.isOnboardingOpen(true);

        // Claim installIntent — must happen after setting isOnboardingOpen
        const intent = redirectStore.get.installIntent();
        if (intent?.listingId) {
            setPendingInstall({ listingId: intent.listingId, appName: intent.appName });
            redirectStore.set.installIntent(null);
        }

        return () => {
            redirectStore.set.isOnboardingOpen(false);
        };
    }, []);

    const updateFormData = (updates: Partial<typeof formData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

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
