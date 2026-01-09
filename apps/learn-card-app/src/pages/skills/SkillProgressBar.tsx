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
        value: 0,
    },
    [SkillLevel.Novice]: {
        color: 'grayscale-700',
        description: 'Just starting and needs guidance.',
        value: 1,
    },
    [SkillLevel.Beginner]: {
        color: 'orange-400',
        description: 'Handles simple tasks without support.',
        value: 2,
    },
    [SkillLevel.Proficient]: {
        color: 'violet-500',
        description: 'Works independently on routine tasks.',
        value: 3,
    },
    [SkillLevel.Advanced]: {
        color: 'light-blue-500',
        description: 'Solves complex tasks efficiently.',
        value: 4,
    },
    [SkillLevel.Expert]: {
        color: 'emerald-500',
        description: 'Deep mastery; can lead and mentor others.',
        value: 5,
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

            <div className="flex gap-[1px] w-full rounded-[20px] overflow-hidden">
                {Object.keys(SkillLevel).map((level: string, index: number) => (
                    <button
                        key={level}
                        onClick={() => setSkillLevel(level as SkillLevel)}
                        className={`flex-1 h-[7px] ${
                            index <= SKILL_LEVEL_META[skillLevel].value
                                ? `bg-${color}`
                                : 'bg-grayscale-200'
                        }`}
                    />
                ))}

                {/* To make sure tailwind puts these colors in the CSS */}
                <span className="hidden bg-orange-400 bg-light-blue-500 text-light-blue-500" />
            </div>
        </div>
    );
};

export default SkillProgressBar;
