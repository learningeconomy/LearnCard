import React, { useEffect, useRef, useState } from 'react';
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

type SkillProgressBarProps = {
    proficiencyLevel?: SkillLevel;
    onChange?: (level: SkillLevel) => void;
};

const SkillProgressBar: React.FC<SkillProgressBarProps> = ({ proficiencyLevel, onChange }) => {
    const [skillLevel, setSkillLevel] = useState<SkillLevel>(proficiencyLevel ?? SkillLevel.Novice);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const segmentRefs = useRef<Array<HTMLDivElement | null>>([]);

    const color = SKILL_LEVEL_META[skillLevel].color;
    const levels = Object.values(SkillLevel) as SkillLevel[];
    const currentIndex = SKILL_LEVEL_META[skillLevel].value;

    const chooseIndexFromClientX = (clientX: number) => {
        let nearestIndex = 0;
        let nearestDistance = Infinity;
        for (let i = 0; i < levels.length; i++) {
            const el = segmentRefs.current[i];
            if (!el) continue;
            const rect = el.getBoundingClientRect();
            if (clientX >= rect.left && clientX <= rect.right) {
                return i;
            }
            const dist = clientX < rect.left ? rect.left - clientX : clientX - rect.right;
            if (dist < nearestDistance) {
                nearestDistance = dist;
                nearestIndex = i;
            }
        }
        return nearestIndex;
    };

    useEffect(() => {
        const onPointerUp = () => setIsDragging(false);
        window.addEventListener('pointerup', onPointerUp);
        return () => window.removeEventListener('pointerup', onPointerUp);
    }, []);

    useEffect(() => {
        if (proficiencyLevel && proficiencyLevel !== skillLevel) {
            setSkillLevel(proficiencyLevel);
        }
    }, [proficiencyLevel]);

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

            <div
                ref={containerRef}
                className="relative flex gap-[1px] w-full rounded-[20px]"
                onPointerDown={e => {
                    setIsDragging(true);
                    const idx = chooseIndexFromClientX(e.clientX);
                    const next = levels[idx];
                    if (next) {
                        setSkillLevel(next);
                        onChange?.(next);
                    }
                }}
                onPointerMove={e => {
                    if (!isDragging) return;
                    const idx = chooseIndexFromClientX(e.clientX);
                    const next = levels[idx];
                    if (next) {
                        setSkillLevel(next);
                        onChange?.(next);
                    }
                }}
            >
                {levels.map((level, index) => {
                    const isCurrentLevel = index === currentIndex;
                    return (
                        <div
                            key={level}
                            className={`flex-1 h-[29px] py-[11px] relative ${
                                isDragging ? 'cursor-grabbing' : 'cursor-pointer'
                            }`}
                            ref={el => (segmentRefs.current[index] = el)}
                        >
                            <div
                                className={`h-[7px]
                                    ${
                                        index <= currentIndex && skillLevel !== SkillLevel.Hidden
                                            ? `bg-${color}`
                                            : 'bg-grayscale-200'
                                    } ${index === 0 ? 'rounded-l-[20px]' : ''} ${
                                    index === levels.length - 1 ? 'rounded-r-[20px]' : ''
                                }
                                `}
                            ></div>
                            {isCurrentLevel && (
                                <div
                                    className={`rounded-[20px] bg-white text-${color} border-solid border-[2px] border-${color} px-[12px] py-[6px] absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] shadow-soft-bottom select-none ${
                                        isDragging ? 'cursor-grabbing' : 'cursor-grab'
                                    }`}
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
                        </div>
                    );
                })}

                {/* Invisible slider overlay for drag and keyboard accessibility */}
                <input
                    type="range"
                    min={0}
                    max={levels.length - 1}
                    step={1}
                    value={currentIndex}
                    onChange={e => {
                        const idx = Number(e.target.value);
                        const next = levels[idx];
                        if (next) {
                            setSkillLevel(next);
                            onChange?.(next);
                        }
                    }}
                    aria-label="Skill level"
                    className="absolute inset-0 w-full h-[29px] opacity-0 pointer-events-none"
                />

                {/* To make sure tailwind puts these colors in the CSS */}
                <span className="hidden bg-orange-400 bg-light-blue-500 text-light-blue-500 border-grayscale-700 border-orange-400 border-light-blue-500" />
            </div>
        </div>
    );
};

export default SkillProgressBar;
