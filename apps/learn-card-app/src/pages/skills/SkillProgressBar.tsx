import React, { useState } from 'react';
import EyeSlash from 'learn-card-base/svgs/EyeSlash';
import Checkmark from 'learn-card-base/svgs/Checkmark';

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

            <div className="flex gap-[1px] w-full rounded-[20px]">
                {Object.keys(SkillLevel).map((level: string, index: number) => {
                    const isCurrentLevel = index === SKILL_LEVEL_META[skillLevel].value;
                    return (
                        <button
                            key={level}
                            onClick={() => setSkillLevel(level as SkillLevel)}
                            className={`flex-1 h-[29px] py-[11px] relative `}
                        >
                            <div
                                className={`h-[7px]
                                    ${
                                        index <= SKILL_LEVEL_META[skillLevel].value &&
                                        skillLevel !== SkillLevel.Hidden
                                            ? `bg-${color}`
                                            : 'bg-grayscale-200'
                                    } ${index === 0 ? 'rounded-l-[20px]' : ''} ${
                                    index === Object.keys(SkillLevel).length - 1
                                        ? 'rounded-r-[20px]'
                                        : ''
                                }
                                `}
                            ></div>
                            {isCurrentLevel && (
                                <div
                                    className={`rounded-[20px] bg-white text-${color} border-solid border-[2px] border-${color} px-[12px] py-[6px] absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] shadow-soft-bottom`}
                                >
                                    {level === SkillLevel.Hidden ? (
                                        <EyeSlash className="h-[13px] w-[14px]" />
                                    ) : (
                                        <Checkmark
                                            className="h-[13px] w-[13px]"
                                            strokeWidth="3"
                                            version="no-padding"
                                        />
                                    )}
                                </div>
                            )}
                        </button>
                    );
                })}

                {/* To make sure tailwind puts these colors in the CSS */}
                <span className="hidden bg-orange-400 bg-light-blue-500 text-light-blue-500 border-grayscale-700 border-orange-400 border-light-blue-500" />
            </div>
        </div>
    );
};

export default SkillProgressBar;
