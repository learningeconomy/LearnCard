import React, { useState } from 'react';

import OnboardingRoles from './onboardingRoles/OnboardingRoles';
import OnboardingFooter from './onboardingFooter/OnboardingFooter';
import OnboardingHeader from './onboardingHeader/OnboardingHeader';
import OnboardingNetworkForm from './onboardingNetworkForm/OnboardingNetworkForm';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { useModal } from 'learn-card-base';

import { LearnCardRolesEnum, OnboardingStepsEnum } from './onboarding.helpers';

const OnboardingContainer: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
    const { closeModal } = useModal();
    const [role, setRole] = useState<LearnCardRolesEnum | null>(null);

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
