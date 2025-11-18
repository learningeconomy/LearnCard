import React, { useState } from 'react';

import OnboardingRoles from './onboardingRoles/OnboardingRoles';
import OnboardingFooter from './onboardingFooter/OnboardingFooter';
import OnboardingHeader from './onboardingHeader/OnboardingHeader';
import OnboardingNetworkForm from './onboardingNetworkForm/OnboardingNetworkForm';
import { useModal } from 'learn-card-base';

import { LearnCardRolesEnum, OnboardingStepsEnum } from './onboarding.helpers';

const OnboardingContainer: React.FC = () => {
    const { closeModal } = useModal();
    const [role, setRole] = useState<LearnCardRolesEnum | null>(null);

    const [step, setStep] = useState<OnboardingStepsEnum>(OnboardingStepsEnum.selectRole);

    if (step === OnboardingStepsEnum.joinNetwork) {
        return (
            <OnboardingNetworkForm
                handleCloseModal={() => closeModal()}
                containerClassName="!pt-2"
                step={step}
                role={role}
                setStep={setStep}
            />
        );
    }

    return (
        <div className="w-full h-full bg-white flex flex-col">
            <div className="max-w-[600px] mx-auto pt-[50px] px-4 overflow-y-scroll h-full pb-[200px] relative">
                <OnboardingHeader text="Select what best describes you!" />
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
            />
        </div>
    );
};

export default OnboardingContainer;
