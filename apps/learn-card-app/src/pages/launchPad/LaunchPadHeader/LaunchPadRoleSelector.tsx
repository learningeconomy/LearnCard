import React, { useEffect, useState } from 'react';
import { useModal } from 'learn-card-base';
import { ProfilePicture } from 'learn-card-base';
import X from 'learn-card-base/svgs/X';

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
        <div className="flex items-center justify-center w-full h-full">
            <div className="relative w-full h-full flex flex-col items-stretch p-4 gap-3 max-w-[380px]">
                <button
                    type="button"
                    aria-label="Close modal"
                    onClick={closeModal}
                    className="self-end mt-[8px] h-[20px] w-[40px] rounded-full bg-transparent text-[#2A2F55] flex items-center justify-center"
                >
                    <X className="w-[20px] h-[20px]" />
                </button>

                <div className="rounded-[15px] bg-white shadow-[0_2px_6px_0_rgba(0,0,0,0.25)] px-[10px] py-[15px]">
                    <div className="w-full flex items-center justify-center mt-[10px]">
                        <span className="inline-flex items-center gap-2 px-[12px] py-[6px]  text-[#2A2F55] text-sm font-poppins font-semibold">
                            Select what best describes you!
                        </span>
                    </div>

                    <div className="mt-[10px]">
                        <OnboardingRoles role={_role} setRole={_setRole} />
                    </div>
                </div>

                <div className="w-full flex items-center justify-center mt-1">
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
        </div>
    );
};

export default LaunchPadRoleSelector;
