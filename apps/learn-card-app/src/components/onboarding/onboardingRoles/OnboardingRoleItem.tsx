import React from 'react';

import { LearnCardRolesEnum, LearnCardRoleType } from '../onboarding.helpers';
import Pencil from '../../svgs/Pencil';
import Checkmark from 'learn-card-base/svgs/Checkmark';

type OnboardingRoleItemProps = {
    role: LearnCardRolesEnum | null;
    setRole: (role: LearnCardRolesEnum) => void;
    roleItem: LearnCardRoleType;
    handleEdit?: () => void;
    showDescription?: boolean;
};

export const OnboardingRoleItem: React.FC<OnboardingRoleItemProps> = ({
    role,
    setRole,
    roleItem,
    handleEdit,
    showDescription = true,
}) => {
    const isSelected = role === roleItem?.type;
    const activeStyles = isSelected ? 'bg-indigo-50 border-indigo-50' : 'border-grayscale-200';

    return (
        <li
            role="button"
            className={`w-full text-grayscale-900 border-solid flex items-center justify-between border-[1px] border-grayscale-200 rounded-[10px] p-4 text-left list-none ${activeStyles}`}
            onClick={e => {
                e.stopPropagation();
                setRole(roleItem?.type as LearnCardRolesEnum);
            }}
        >
            <div className="flex flex-col gap-[5px] items-start justify-between">
                <p className="font-semibold text-[17px] font-poppins">
                    {!showDescription && isSelected && (
                        <span className="text-grayscale-800 font-normal">I'm a {''}</span>
                    )}
                    {!showDescription && !isSelected ? 'Select Role' : roleItem?.title}
                </p>
                {showDescription && (
                    <p className="text-grayscale-600 text-[14px] font-poppins">
                        {roleItem?.description}
                    </p>
                )}
            </div>
            {handleEdit ? (
                <button
                    type="button"
                    onClick={e => {
                        e.stopPropagation();
                        handleEdit?.();
                    }}
                >
                    <Pencil className="w-[24px] h-[24px] text-grayscale-900" strokeWidth="2" />
                </button>
            ) : (
                isSelected && <Checkmark className="w-[24px] h-[24px] text-[#2A2F55]" />
            )}
        </li>
    );
};

export default OnboardingRoleItem;
