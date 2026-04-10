import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { CalendarClock, ChevronRight } from 'lucide-react';

import careerOneStopLogo from '../../assets/images/career-one-stop-logo.png';
import AiPathwaySchoolProgramDetails from './ai-pathway-courses/AiPathwaySchoolProgramDetails';

import {
    useModal,
    ModalTypes,
    useSemanticSearchSkills,
    conditionalPluralize,
    TrainingProgram,
} from 'learn-card-base';
import { getProgramLengthDisplay } from './ai-pathway-courses/ai-pathway-courses.helpers';
import { ThickStudiesIconWithShape } from 'learn-card-base/svgs/wallet/StudiesIcon';
import CompetencyIcon from '../SkillFrameworks/CompetencyIcon';

const SKILL_CHIP_GAP_PX = 5;
const MIN_LAST_SKILL_WIDTH_PX = 100;

type GrowSkillsCourseProgram = TrainingProgram & {
    school?: {
        image_url?: string;
    };
};

type SemanticSkillRecord = {
    icon?: string;
    statement?: string;
};

type GrowSkillsCourseItemProps = {
    program: GrowSkillsCourseProgram;
};

const GrowSkillsCourseItem: React.FC<GrowSkillsCourseItemProps> = ({ program }) => {
    const flags = useFlags();
    const { newModal } = useModal();
    const skillsRowRef = useRef<HTMLDivElement | null>(null);
    const measurementChipRefs = useRef<Array<HTMLSpanElement | null>>([]);
    const measurementBadgeRefs = useRef<Array<HTMLSpanElement | null>>([]);
    const [visibleSkillCount, setVisibleSkillCount] = useState(1);

    const programLengthDisplay = getProgramLengthDisplay(program);

    const frameworkId = flags?.selfAssignedSkillsFrameworkId;
    const searchQuery = program?.ProgramName;
    const { data: semanticSearchSkillsData } = useSemanticSearchSkills(searchQuery, frameworkId, {
        limit: 25,
    });

    const skills = (semanticSearchSkillsData?.records ?? []) as SemanticSkillRecord[];

    const recalculateVisibleSkillCount = useCallback(() => {
        const rowElement = skillsRowRef.current;

        if (!rowElement) {
            return;
        }

        if (skills.length === 0) {
            setVisibleSkillCount(0);
            return;
        }

        const availableWidth = rowElement.clientWidth;

        if (!availableWidth) {
            return;
        }

        const chipWidths = skills.map((_: SemanticSkillRecord, index: number) => {
            const chipElement = measurementChipRefs.current[index];

            return chipElement?.getBoundingClientRect().width ?? 0;
        });

        const getPlusBadgeWidth = (hiddenCount: number) => {
            const badgeElement = measurementBadgeRefs.current[hiddenCount];

            return badgeElement?.getBoundingClientRect().width ?? 0;
        };

        let nextVisibleCount = 1;

        for (let count = 1; count <= skills.length; count += 1) {
            const hiddenCount = skills.length - count;
            let fixedWidth = 0;

            for (let i = 0; i < count - 1; i += 1) {
                if (i > 0) {
                    fixedWidth += SKILL_CHIP_GAP_PX;
                }

                fixedWidth += chipWidths[i] ?? 0;
            }

            if (count > 1) {
                fixedWidth += SKILL_CHIP_GAP_PX;
            }

            if (hiddenCount > 0) {
                fixedWidth += SKILL_CHIP_GAP_PX + getPlusBadgeWidth(hiddenCount);
            }

            const remainingForLastChip = availableWidth - fixedWidth;

            if (remainingForLastChip >= MIN_LAST_SKILL_WIDTH_PX) {
                nextVisibleCount = count;
                continue;
            }

            break;
        }

        setVisibleSkillCount(prev => (prev === nextVisibleCount ? prev : nextVisibleCount));
    }, [skills]);

    useLayoutEffect(() => {
        recalculateVisibleSkillCount();
    }, [recalculateVisibleSkillCount]);

    useEffect(() => {
        const rowElement = skillsRowRef.current;

        if (!rowElement || typeof ResizeObserver === 'undefined') {
            return;
        }

        let animationFrameId: number | null = null;

        const resizeObserver = new ResizeObserver(() => {
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }

            animationFrameId = requestAnimationFrame(recalculateVisibleSkillCount);
        });

        resizeObserver.observe(rowElement);

        return () => {
            resizeObserver.disconnect();

            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [recalculateVisibleSkillCount]);

    const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
    const hasDraggedRef = useRef(false);

    const dragThreshold = 8;

    const openCourseDetailsModal = () => {
        newModal(<AiPathwaySchoolProgramDetails program={program} />, undefined, {
            desktop: ModalTypes.Right,
            mobile: ModalTypes.Right,
        });
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        pointerStartRef.current = {
            x: event.clientX,
            y: event.clientY,
        };
        hasDraggedRef.current = false;
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!pointerStartRef.current) return;

        const deltaX = Math.abs(event.clientX - pointerStartRef.current.x);
        const deltaY = Math.abs(event.clientY - pointerStartRef.current.y);

        if (deltaX > dragThreshold || deltaY > dragThreshold) {
            hasDraggedRef.current = true;
        }
    };

    const handlePointerUp = () => {
        pointerStartRef.current = null;
    };

    const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!hasDraggedRef.current) return;

        event.preventDefault();
        event.stopPropagation();
        hasDraggedRef.current = false;
    };

    const schoolImage = program?.school?.image_url;
    const logo = schoolImage ? schoolImage : careerOneStopLogo;
    const visibleSkills = skills.slice(0, visibleSkillCount);
    const hiddenSkillsCount = Math.max(skills.length - visibleSkillCount, 0);
    const lastVisibleSkillIndex = visibleSkills.length - 1;

    return (
        <div
            role="button"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClickCapture={handleClickCapture}
            onClick={openCourseDetailsModal}
            className="w-full h-full flex flex-col rounded-[15px] bg-white shadow-bottom-4-4 overflow-hidden cursor-pointer border-b-[3px] border-emerald-500 text-left"
        >
            <div className="px-[15px] py-[20px] flex flex-col gap-[5px] h-full">
                <div className="flex items-start gap-[10px]">
                    <ThickStudiesIconWithShape className="w-[35px] h-[35px] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <h3 className="text-[17px] font-poppins font-[600] text-grayscale-900 leading-[24px] tracking-[0.25px] line-clamp-2 text-left">
                            {program?.ProgramName}
                        </h3>
                    </div>
                    <ChevronRight className="w-[20px] h-[20px] text-grayscale-700 flex-shrink-0" />
                </div>

                <div className="flex gap-[10px]">
                    <div className="flex flex-col gap-[5px]">
                        <p className="text-[14px] text-grayscale-600 font-notoSans text-left">
                            {program?.SchoolName}
                        </p>
                        {programLengthDisplay && (
                            <div className="flex items-center gap-[5px]">
                                <CalendarClock className="w-[20px] h-[20px] text-grayscale-700 flex-shrink-0" />
                                <span className="text-[13px] text-grayscale-600 font-bold font-poppins capitalize">
                                    {programLengthDisplay}
                                </span>
                            </div>
                        )}
                    </div>

                    <img
                        src={logo}
                        alt={program?.SchoolName || 'Institution'}
                        className="!w-[40px] !h-[40px] rounded-full object-contain shrink-0 ml-auto"
                    />
                </div>

                {skills.length > 0 && (
                    <div className="pt-[10px] mt-auto flex flex-col gap-[5px] relative w-full min-w-0">
                        <p className="text-[14px] text-grayscale-600 font-bold leading-[14px] tracking-[0.32px]">
                            {conditionalPluralize(skills.length, 'Skill')}
                        </p>

                        <div
                            ref={skillsRowRef}
                            className="flex items-center gap-[5px] w-full overflow-hidden"
                        >
                            {visibleSkills.map((skill: SemanticSkillRecord, index: number) => {
                                const isLastVisible = index === lastVisibleSkillIndex;

                                return (
                                    <span
                                        key={`${skill?.statement ?? 'skill'}-${
                                            skill?.icon ?? 'icon'
                                        }-${index}`}
                                        className={
                                            isLastVisible
                                                ? 'min-w-0 text-[13px] px-[10px] py-[5px] text-grayscale-900 font-poppins bg-violet-50 rounded-[40px] inline-flex gap-[5px] items-center leading-[130%] font-bold overflow-hidden'
                                                : 'shrink-0 text-[13px] px-[10px] py-[5px] text-grayscale-900 font-poppins bg-violet-50 rounded-[40px] inline-flex gap-[5px] items-center leading-[130%] font-bold whitespace-nowrap'
                                        }
                                    >
                                        <CompetencyIcon icon={skill?.icon} size="x-small" />
                                        <span className={isLastVisible ? 'min-w-0 truncate' : ''}>
                                            {skill?.statement}
                                        </span>
                                    </span>
                                );
                            })}

                            {hiddenSkillsCount > 0 && (
                                <span className="shrink-0 text-[13px] px-[10px] py-[5px] text-grayscale-900 font-poppins bg-violet-50 rounded-[40px] inline-flex gap-[5px] items-center leading-[130%] font-bold whitespace-nowrap">
                                    +{hiddenSkillsCount}
                                </span>
                            )}
                        </div>

                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 -z-10 opacity-0 overflow-hidden"
                        >
                            <div className="flex gap-[5px]">
                                {skills.map((skill: SemanticSkillRecord, index: number) => (
                                    <span
                                        key={`measure-skill-${index}`}
                                        ref={(el: HTMLSpanElement | null) => {
                                            measurementChipRefs.current[index] = el;
                                        }}
                                        className="text-[13px] px-[10px] py-[5px] text-grayscale-900 font-poppins bg-violet-50 rounded-[40px] inline-flex gap-[5px] items-center leading-[130%] font-bold whitespace-nowrap"
                                    >
                                        <CompetencyIcon icon={skill?.icon} size="x-small" />
                                        <span>{skill?.statement}</span>
                                    </span>
                                ))}
                            </div>

                            <div className="mt-[5px] flex gap-[5px]">
                                {Array.from(
                                    { length: Math.max(skills.length - 1, 0) },
                                    (_unused: unknown, index: number) => index + 1
                                ).map((hiddenCount: number) => (
                                    <span
                                        key={`measure-badge-${hiddenCount}`}
                                        ref={(el: HTMLSpanElement | null) => {
                                            measurementBadgeRefs.current[hiddenCount] = el;
                                        }}
                                        className="text-[13px] px-[10px] py-[5px] text-grayscale-900 font-poppins bg-violet-50 rounded-[40px] inline-flex gap-[5px] items-center leading-[130%] font-bold whitespace-nowrap"
                                    >
                                        +{hiddenCount}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GrowSkillsCourseItem;
