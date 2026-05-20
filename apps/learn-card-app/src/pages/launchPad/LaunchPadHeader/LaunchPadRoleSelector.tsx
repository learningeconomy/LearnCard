import React from 'react';
import { useModal } from 'learn-card-base';

import OnboardingRoles from '../../../components/onboarding/onboardingRoles/OnboardingRoles';
import { LearnCardRolesEnum } from '../../../components/onboarding/onboarding.helpers';

type LaunchPadRoleSelectorProps = {
    role: LearnCardRolesEnum | null;
    setRole: (role: LearnCardRolesEnum) => void;
};

/**
 * Mobile bottom-sheet role picker. Tapping a role immediately applies it
 * and dismisses the sheet — there is no Save button.
 *
 * Desktop uses an inline HeadlessUI Menu in LaunchPadActionModal instead,
 * so this component is only rendered on mobile widths.
 */
const LaunchPadRoleSelector: React.FC<LaunchPadRoleSelectorProps> = ({ role, setRole }) => {
    const { closeModal } = useModal();

    const handlePick = (newRole: LearnCardRolesEnum) => {
        setRole(newRole);
        closeModal();
    };

    return (
        <div className="w-full flex flex-col items-stretch p-4 gap-3">
            <div className="rounded-[15px] bg-white px-[10px] py-[15px]">
                <div className="w-full flex items-center justify-center mt-[4px] mb-[8px]">
                    <span className="inline-flex items-center gap-2 px-[12px] py-[6px] text-[#2A2F55] text-sm font-poppins font-semibold">
                        Select what best describes you!
                    </span>
                </div>

                <OnboardingRoles role={role} setRole={handlePick} />
            </div>
        </div>
    );
};

export default LaunchPadRoleSelector;
