import React, { useEffect, useRef, useState } from 'react';
import EyeSlash from 'learn-card-base/svgs/EyeSlash';
import Checkmark from 'learn-card-base/svgs/Checkmark';

export enum SkillLevel {
    Hidden = 0,
    Novice = 1,
    Beginner = 2,
    Proficient = 3,
    Advanced = 4,
    Expert = 5,
}

const SKILL_LEVEL_META = {
    [SkillLevel.Hidden]: {
        name: 'Hidden',
        color: 'grayscale-500',
        description: 'Do not display your proficiency status.',
    },
    [SkillLevel.Novice]: {
        name: 'Novice',
        color: 'grayscale-700',
        description: 'Just starting and needs guidance.',
    },
    [SkillLevel.Beginner]: {
        name: 'Beginner',
        color: 'orange-400',
        description: 'Handles simple tasks without support.',
    },
    [SkillLevel.Proficient]: {
        name: 'Proficient',
        color: 'violet-500',
        description: 'Works independently on routine tasks.',
    },
    [SkillLevel.Advanced]: {
        name: 'Advanced',
        color: 'light-blue-500',
        description: 'Solves complex tasks efficiently.',
    },
    [SkillLevel.Expert]: {
        name: 'Expert',
        color: 'emerald-500',
        description: 'Deep mastery; can lead and mentor others.',
    },
};

const LEVELS: SkillLevel[] = [
    SkillLevel.Hidden,
    SkillLevel.Novice,
    SkillLevel.Beginner,
    SkillLevel.Proficient,
    SkillLevel.Advanced,
    SkillLevel.Expert,
];

type SkillProficiencyBarProps = {
    proficiencyLevel?: SkillLevel;
    onChange?: (level: SkillLevel) => void;
};

const SkillProficiencyBar: React.FC<SkillProficiencyBarProps> = ({
    proficiencyLevel,
    onChange,
}) => {
    const [skillLevel, setSkillLevel] = useState<SkillLevel>(proficiencyLevel ?? SkillLevel.Hidden);
    const [isDragging, setIsDragging] = useState(false);
    const [thumbLeftPx, setThumbLeftPx] = useState<number | null>(null);
    const [thumbHalfWidthPx, setThumbHalfWidthPx] = useState(0);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const segmentRefs = useRef<Array<HTMLDivElement | null>>([]);
    const lastPointerClientXRef = useRef<number | null>(null);
    const skillLevelRef = useRef<SkillLevel>(skillLevel);
    const onChangeRef = useRef<SkillProficiencyBarProps['onChange']>(onChange);
    const thumbRef = useRef<HTMLDivElement | null>(null);

    const color = SKILL_LEVEL_META[skillLevel].color;
    const currentIndex = skillLevel;

    useEffect(() => {
        skillLevelRef.current = skillLevel;
    }, [skillLevel]);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        const measure = () => {
            const el = thumbRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            setThumbHalfWidthPx(rect.width / 2);
        };
        measure();

        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, []);

    const getThumbLeftPxFromClientX = (clientX: number) => {
        const container = containerRef.current;
        if (!container) return null;
        const rect = container.getBoundingClientRect();
        const x = clientX - rect.left;
        const min = thumbHalfWidthPx;
        const max = Math.max(thumbHalfWidthPx, rect.width - thumbHalfWidthPx);
        return Math.max(min, Math.min(max, x));
    };

    const getSegmentCenterLeftPx = (idx: number) => {
        const container = containerRef.current;
        const segment = segmentRefs.current[idx];
        if (!container || !segment) return null;
        const containerRect = container.getBoundingClientRect();
        const segmentRect = segment.getBoundingClientRect();
        return segmentRect.left - containerRect.left + segmentRect.width / 2;
    };

    const chooseIndexFromClientX = (clientX: number) => {
        let nearestIndex = 0;
        let nearestDistance = Infinity;
        for (let i = 0; i < LEVELS.length; i++) {
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
        if (!isDragging) return;

        const onPointerMove = (e: PointerEvent) => {
            lastPointerClientXRef.current = e.clientX;
            setThumbLeftPx(getThumbLeftPxFromClientX(e.clientX));

            const idx = chooseIndexFromClientX(e.clientX);
            const next = LEVELS[idx];
            if (idx >= 0 && idx < LEVELS.length && next !== skillLevelRef.current) {
                skillLevelRef.current = next;
                setSkillLevel(next);
                onChangeRef.current?.(next);
            }
        };

        const onPointerUp = () => {
            setIsDragging(false);

            const clientX = lastPointerClientXRef.current;
            if (clientX == null) return;

            const idx = chooseIndexFromClientX(clientX);
            const next = LEVELS[idx];
            if (idx >= 0 && idx < LEVELS.length) {
                skillLevelRef.current = next;
                setSkillLevel(next);
                onChangeRef.current?.(next);
            }
            setThumbLeftPx(getSegmentCenterLeftPx(idx));
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        return () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };
    }, [isDragging, thumbHalfWidthPx]);

    useEffect(() => {
        if (isDragging) return;
        setThumbLeftPx(getSegmentCenterLeftPx(currentIndex));
    }, [currentIndex, isDragging]);

    useEffect(() => {
        const onResize = () => {
            if (isDragging) return;
            setThumbLeftPx(getSegmentCenterLeftPx(currentIndex));
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [currentIndex, isDragging]);

    useEffect(() => {
        if (proficiencyLevel && proficiencyLevel !== skillLevel) {
            setSkillLevel(proficiencyLevel);
        }
    }, [proficiencyLevel]);

    return (
        <div className="flex flex-col gap-[15px] w-full">
            <div className="flex flex-col">
                <p className="text-grayscale-800 font-poppins font-[600] text-[14px]">
                    Skill Level -{' '}
                    <span className={`text-${color}`}>{SKILL_LEVEL_META[skillLevel].name}</span>
                </p>
                <p className="text-grayscale-700 font-poppins text-[12px]">
                    {SKILL_LEVEL_META[skillLevel].description}
                </p>
            </div>

            <div
                ref={containerRef}
                className="relative flex gap-[1px] w-full rounded-[20px] select-none touch-none"
                onPointerDown={e => {
                    setIsDragging(true);
                    lastPointerClientXRef.current = e.clientX;
                    setThumbLeftPx(getThumbLeftPxFromClientX(e.clientX));

                    const idx = chooseIndexFromClientX(e.clientX);
                    const next = LEVELS[idx];
                    if (idx >= 0 && idx < LEVELS.length && next !== skillLevelRef.current) {
                        skillLevelRef.current = next;
                        setSkillLevel(next);
                        onChangeRef.current?.(next);
                    }
                }}
            >
                {LEVELS.map((level, index) => {
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
                                    index === LEVELS.length - 1 ? 'rounded-r-[20px]' : ''
                                }
                                `}
                            ></div>
                        </div>
                    );
                })}

                <div
                    ref={thumbRef}
                    className={`rounded-[20px] bg-white text-${color} border-solid border-[2px] border-${color} px-[12px] py-[6px] absolute top-[50%] translate-x-[-50%] translate-y-[-50%] shadow-soft-bottom select-none z-10 ${
                        isDragging
                            ? 'cursor-grabbing'
                            : 'cursor-grab transition-[left] duration-150 ease-out'
                    }`}
                    style={{ left: thumbLeftPx != null ? `${thumbLeftPx}px` : undefined }}
                >
                    {skillLevel === SkillLevel.Hidden ? (
                        <EyeSlash className="h-[13px] w-[14px]" />
                    ) : (
                        <Checkmark
                            className="h-[13px] w-[13px]"
                            strokeWidth="3"
                            version="no-padding"
                        />
                    )}
                </div>

                {/* Invisible slider overlay for drag and keyboard accessibility */}
                <input
                    type="range"
                    min={0}
                    max={LEVELS.length - 1}
                    step={1}
                    value={currentIndex}
                    onChange={e => {
                        const idx = Number(e.target.value);
                        const next = LEVELS[idx];
                        if (idx >= 0 && idx < LEVELS.length) {
                            skillLevelRef.current = next;
                            setSkillLevel(next);
                            onChange?.(next);
                        }
                    }}
                    aria-label="Skill level"
                    className="absolute inset-0 w-full h-[29px] opacity-0 pointer-events-none"
                />

                {/* To make sure tailwind puts these colors in the CSS */}
                <span className="hidden bg-orange-400 bg-light-blue-500 bg-violet-500 bg-emerald-500 bg-grayscale-500 text-light-blue-500 text-violet-500 text-emerald-500 text-grayscale-500 border-grayscale-700 border-orange-400 border-light-blue-500 border-violet-500 border-emerald-500 border-grayscale-500" />
            </div>
        </div>
    );
};

export default SkillProficiencyBar;
