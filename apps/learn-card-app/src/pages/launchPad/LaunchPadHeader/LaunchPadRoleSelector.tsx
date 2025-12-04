import React, { useEffect, useState } from 'react';
import { useModal } from 'learn-card-base';
import { ProfilePicture } from 'learn-card-base';

import OnboardingRoles from '../../../components/onboarding/onboardingRoles/OnboardingRoles';
import { LearnCardRolesEnum } from '../../../components/onboarding/onboarding.helpers';

type LaunchPadRoleSelectorProps = {
    role: LearnCardRolesEnum | null;
    setRole: (role: LearnCardRolesEnum) => void;
};

const LaunchPadRoleSelector: React.FC<LaunchPadRoleSelectorProps> = ({ role, setRole }) => {
    const { closeModal } = useModal();
    const [_role, _setRole] = useState<LearnCardRolesEnum | null>(role);

    useEffect(() => {
        if (role) {
            _setRole(role);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isDisabled = !_role;
    const activeStyles = isDisabled ? 'bg-grayscale-200 text-white' : 'bg-emerald-700 text-white';

    return (
        <div className="px-4 py-6">
            <div className="w-full flex items-center justify-center">
                <ProfilePicture
                    customContainerClass="flex justify-center items-center h-[48px] w-[48px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-xl min-w-[48px] min-h-[48px]"
                    customImageClass="flex justify-center items-center h-[48px] w-[48px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[48px] min-h-[48px]"
                    customSize={120}
                />
            </div>
            <h3 className="text-center text-[20px] font-poppins font-semibold text-[#2A2F55] mt-[10px]">
                Select Role
            </h3>

            <div className="mt-[10px]">
                <OnboardingRoles role={_role} setRole={_setRole} />
            </div>

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

export default LaunchPadRoleSelector;
