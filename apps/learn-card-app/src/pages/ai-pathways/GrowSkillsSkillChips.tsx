import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { conditionalPluralize, useSemanticSearchSkills } from 'learn-card-base';

import CompetencyIcon from '../SkillFrameworks/CompetencyIcon';

const SKILL_CHIP_GAP_PX = 5;
const MIN_LAST_SKILL_WIDTH_PX = 100;

type GrowSkillsSkillRecord = {
    icon?: string;
    statement?: string;
    title?: string;
};

type GrowSkillsSkillChipsProps =
    | {
          searchQuery: string;
          skills?: never;
          className?: string;
          layout?: 'truncate' | 'wrap';
      }
    | {
          skills: GrowSkillsSkillRecord[];
          searchQuery?: never;
          className?: string;
          layout?: 'truncate' | 'wrap';
      };

const GrowSkillsSkillChips: React.FC<GrowSkillsSkillChipsProps> = props => {
    const flags = useFlags();
    const frameworkId = flags?.selfAssignedSkillsFrameworkId;
    const searchQuery = 'searchQuery' in props ? props.searchQuery : undefined;
    const providedSkills = 'skills' in props ? props.skills : undefined;
    const layout = 'layout' in props ? props.layout ?? 'truncate' : 'truncate';
    const containerClassName = 'className' in props ? props.className ?? '' : '';
    const isWrapLayout = layout === 'wrap';

    const { data: semanticSearchSkillsData } = useSemanticSearchSkills(
        searchQuery ?? '',
        frameworkId ?? '',
        {
            limit: 25,
        }
    );

    const skills =
        providedSkills ?? ((semanticSearchSkillsData?.records ?? []) as GrowSkillsSkillRecord[]);
    const skillsRowRef = useRef<HTMLDivElement | null>(null);
    const measurementChipRefs = useRef<Array<HTMLSpanElement | null>>([]);
    const measurementBadgeRefs = useRef<Array<HTMLSpanElement | null>>([]);
    const [visibleSkillCount, setVisibleSkillCount] = useState(1);

    const recalculateVisibleSkillCount = useCallback(() => {
        if (isWrapLayout) {
            return;
        }

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

        const chipWidths = skills.map((_: GrowSkillsSkillRecord, index: number) => {
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
    }, [isWrapLayout, skills]);

    useLayoutEffect(() => {
        if (!isWrapLayout) {
            recalculateVisibleSkillCount();
        }
    }, [isWrapLayout, recalculateVisibleSkillCount]);

    useEffect(() => {
        if (isWrapLayout) {
            return;
        }

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
    }, [isWrapLayout, recalculateVisibleSkillCount]);

    if (skills.length === 0) {
        return null;
    }

    const visibleSkills = skills.slice(0, visibleSkillCount);
    const hiddenSkillsCount = Math.max(skills.length - visibleSkillCount, 0);
    const lastVisibleSkillIndex = visibleSkills.length - 1;

    const getSkillLabel = (skill: GrowSkillsSkillRecord) => skill?.statement ?? skill?.title ?? '';
    const rootClassName = isWrapLayout
        ? `flex flex-col gap-[10px] relative w-full min-w-0 ${containerClassName}`
        : `pt-[10px] mt-auto flex flex-col gap-[5px] relative w-full min-w-0 ${containerClassName}`;
    const skillChipClassName =
        'shrink-0 text-[13px] px-[10px] py-[5px] text-grayscale-900 font-poppins bg-violet-50 rounded-[40px] inline-flex gap-[5px] items-center leading-[130%] font-bold whitespace-nowrap';
    const skillRowClassName = isWrapLayout
        ? 'flex flex-wrap gap-[5px]'
        : 'flex items-center gap-[5px] w-full overflow-hidden';

    return (
        <div className={rootClassName}>
            <p className="text-[14px] text-grayscale-600 font-bold leading-[14px] tracking-[0.32px]">
                {conditionalPluralize(skills.length, 'Skill')}
            </p>

            {isWrapLayout ? (
                <div className={skillRowClassName}>
                    {skills.map((skill: GrowSkillsSkillRecord, index: number) => {
                        const skillLabel = getSkillLabel(skill);

                        return (
                            <span
                                key={`${skillLabel || 'skill'}-${skill?.icon ?? 'icon'}-${index}`}
                                className={skillChipClassName}
                            >
                                <CompetencyIcon icon={skill?.icon} size="x-small" />
                                <span>{skillLabel}</span>
                            </span>
                        );
                    })}
                </div>
            ) : (
                <>
                    <div ref={skillsRowRef} className={skillRowClassName}>
                        {visibleSkills.map((skill: GrowSkillsSkillRecord, index: number) => {
                            const isLastVisible = index === lastVisibleSkillIndex;
                            const skillLabel = getSkillLabel(skill);

                            return (
                                <span
                                    key={`${skillLabel || 'skill'}-${
                                        skill?.icon ?? 'icon'
                                    }-${index}`}
                                    className={
                                        isLastVisible
                                            ? 'min-w-0 text-[13px] px-[10px] py-[5px] text-grayscale-900 font-poppins bg-violet-50 rounded-[40px] inline-flex gap-[5px] items-center leading-[130%] font-bold overflow-hidden'
                                            : skillChipClassName
                                    }
                                >
                                    <CompetencyIcon icon={skill?.icon} size="x-small" />
                                    <span className={isLastVisible ? 'min-w-0 truncate' : ''}>
                                        {skillLabel}
                                    </span>
                                </span>
                            );
                        })}

                        {hiddenSkillsCount > 0 && (
                            <span className={skillChipClassName}>+{hiddenSkillsCount}</span>
                        )}
                    </div>

                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 -z-10 opacity-0 overflow-hidden"
                    >
                        <div className="flex gap-[5px]">
                            {skills.map((skill: GrowSkillsSkillRecord, index: number) => (
                                <span
                                    key={`measure-skill-${index}`}
                                    ref={(el: HTMLSpanElement | null) => {
                                        measurementChipRefs.current[index] = el;
                                    }}
                                    className={skillChipClassName}
                                >
                                    <CompetencyIcon icon={skill?.icon} size="x-small" />
                                    <span>{getSkillLabel(skill)}</span>
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
                                    className={skillChipClassName}
                                >
                                    +{hiddenCount}
                                </span>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default GrowSkillsSkillChips;
