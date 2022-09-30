import React from 'react';
import { RoundedPill } from '../RoundedPill';
import { LCSubtypes } from '../../types';
import { CircleCheckButton } from '../CircleCheckButton';
import { SkillTabCardProps } from '../../types';

export const SkillTabCard: React.FC<SkillTabCardProps> = ({
    title,
    description,
    checked = false,
    showChecked,
    onClick,
    onCheckClicked,
    className = 'skill-tab-card',
}) => {
    return (
        <div
            className={`flex-col flex justify-between items-center font-bold shadow-[0_0_8px_0px_rgba(0,0,0,0.2)] relative $ py-[8px] px-[8px] w-[190px] h-[168px] rounded-[20px] ${className}`}
        >
            {showChecked && (
                <CircleCheckButton
                    onClick={onCheckClicked}
                    checked={checked}
                    bgColor="bg-grayscale-200"
                />
            )}
            <h4 className="text-indigo-600 text-[14px] text-center line-clamp-2">{title}</h4>
            <p className="line-clamp-2 text-[12px] text-center">{description}</p>

            <RoundedPill type={LCSubtypes.skill} statusText={'Earned'} onClick={onClick} />
        </div>
    );
};

export default SkillTabCard;
