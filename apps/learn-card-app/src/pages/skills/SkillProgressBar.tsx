import React, { useState } from 'react';

export enum SkillLevel {
    Hidden = 'Hidden',
    Novice = 'Novice',
    Beginner = 'Beginner',
    Proficient = 'Proficient',
    Advanced = 'Advanced',
    Expert = 'Expert',
}

const SKILL_LEVEL_META = {
    [SkillLevel.Hidden]: {
        color: 'grayscale-500',
        description: 'Do not display your proficiency status.',
    },
    [SkillLevel.Novice]: {
        color: 'grayscale-600',
        description: 'Just starting and needs guidance.',
    },
    [SkillLevel.Beginner]: {
        color: 'orange-400',
        description: 'Handles simple tasks without support.',
    },
    [SkillLevel.Proficient]: {
        color: 'violet-500',
        description: 'Works independently on routine tasks.',
    },
    [SkillLevel.Advanced]: {
        color: 'light-blue-500',
        description: 'Solves complex tasks efficiently.',
    },
    [SkillLevel.Expert]: {
        color: 'emerald-500',
        description: 'Deep mastery; can lead and mentor others.',
    },
};

type SkillProgressBarProps = {};

const SkillProgressBar: React.FC<SkillProgressBarProps> = ({}) => {
    const [skillLevel, setSkillLevel] = useState<SkillLevel>(SkillLevel.Novice);

    const color = SKILL_LEVEL_META[skillLevel].color;

    return (
        <div className="flex flex-col gap-[15px]">
            <div className="flex flex-col">
                <p className="text-grayscale-800 font-poppins font-[600] text-[14px]">
                    Skill Level - <span className={`text-${color}`}>{skillLevel}</span>
                </p>
                <p className="text-grayscale-700 font-poppins text-[12px]">
                    {SKILL_LEVEL_META[skillLevel].description}
                </p>
            </div>
        </div>
    );
};

export default SkillProgressBar;
