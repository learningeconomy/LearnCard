import React from 'react';

import { LearnCardRolesEnum, LearnCardRoleType } from '../onboarding.helpers';
import Pencil from '../../svgs/Pencil';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import LearnerIcon from '../../../assets/images/quicknavroles/learnergradcapicon.png';
import GuardianIcon from '../../../assets/images/quicknavroles/guardianhomeicon.png';
import TeacherIcon from '../../../assets/images/quicknavroles/teacherappleicon.png';
import AdminIcon from '../../../assets/images/quicknavroles/adminshieldicon.png';
import DeveloperIcon from '../../../assets/images/quicknavroles/developeralienicon.png';

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
    const activeStyles = isSelected ? 'bg-[#CCFBF1] border-[#CCFBF1]' : 'border-grayscale-200';

    const roleIcons: Record<LearnCardRolesEnum, string> = {
        [LearnCardRolesEnum.learner]: LearnerIcon,
        [LearnCardRolesEnum.guardian]: GuardianIcon,
        [LearnCardRolesEnum.teacher]: TeacherIcon,
        [LearnCardRolesEnum.admin]: AdminIcon,
        [LearnCardRolesEnum.counselor]: TeacherIcon,
        [LearnCardRolesEnum.developer]: DeveloperIcon,
    };

    const iconSrc = roleIcons[roleItem?.type as LearnCardRolesEnum];

    const iconBgColors: Record<LearnCardRolesEnum, string> = {
        [LearnCardRolesEnum.learner]: 'var(--teal-200, #99F6E4)',
        [LearnCardRolesEnum.guardian]: 'var(--ion-color-violet-200)',
        [LearnCardRolesEnum.teacher]: 'var(--ion-color-amber-100)',
        [LearnCardRolesEnum.admin]: 'var(--ion-color-cyan-100)',
        [LearnCardRolesEnum.counselor]: 'var(--ion-color-violet-200)',
        [LearnCardRolesEnum.developer]: 'var(--lime-300, #BEF264)',
    };

    const iconBgStyle: React.CSSProperties = {
        backgroundColor: iconBgColors[roleItem?.type as LearnCardRolesEnum],
    };

    return (
        <li
            role="button"
            className={`w-full text-grayscale-900 border-solid flex items-center justify-between border-[1px] rounded-[10px] p-4 text-left list-none ${activeStyles}`}
            onClick={e => {
                e.stopPropagation();
                setRole(roleItem?.type as LearnCardRolesEnum);
            }}
        >
            <div className="flex items-center gap-3">
                <span
                    className="flex shrink-0 items-center justify-center h-[36px] w-[36px] rounded-full"
                    style={iconBgStyle}
                >
                    <img
                        src={iconSrc}
                        alt={`${roleItem?.title} icon`}
                        className="h-[28px] w-[28px] object-contain"
                    />
                </span>

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
