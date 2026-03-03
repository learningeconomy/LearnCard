import React, { useEffect, useState } from 'react';

import OnboardingHeader from '../onboardingHeader/OnboardingHeader';
import OnboardingRoles from './OnboardingRoles';

import { LearnCardRolesEnum } from '../onboarding.helpers';
import { useModal } from 'learn-card-base';

export const OnboardingRolesContainer = ({
    role,
    setRole,
}: {
    role: LearnCardRolesEnum | null;
    setRole: (role: LearnCardRolesEnum) => void;
}) => {
    const { closeModal } = useModal();
    const [_role, _setRole] = useState<LearnCardRolesEnum | null>(role);

    useEffect(() => {
        if (role) {
            _setRole(role);
        }
    }, []);

    const isDisabled = !_role;
    const activeStyles = isDisabled ? 'bg-grayscale-200 text-white' : 'bg-emerald-700 text-white';

    return (
        <div className="px-4 py-6">
            <OnboardingHeader text="Select what best describes you!" hideTitle />
            <OnboardingRoles role={_role} setRole={_setRole} />

            <div className="w-full flex items-center justify-center mt-6">
                <button
                    disabled={isDisabled}
                    onClick={() => {
                        setRole(_role as LearnCardRolesEnum);
                        closeModal();
                    }}
                    className={`py-[9px] pl-[20px] font-semibold pr-[15px] rounded-[30px] font-notoSans text-[17px] leading-[24px] max-h-[42px] tracking-[0.25px] text-grayscale-900 w-full flex gap-[5px] justify-center mr-2 shadow-button-bottom ${activeStyles}`}
                >
                    Save
                </button>
            </div>
        </div>
    );
};

export default OnboardingRolesContainer;
