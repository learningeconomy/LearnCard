import {
    getClrResultLabel,
    getResultDisplayValue,
} from 'learn-card-base/helpers/credentials/clr/presentation';
import React, { useState } from 'react';
import { ClrCreditValues } from './ClrCreditValues';
import {
    summarizeClrCredits,
    formatClrCreditTotal,
} from 'learn-card-base/helpers/credentials/clr/credits';

import { ChevronDown, ChevronRight, Paperclip } from 'lucide-react';
import { SkillsIcon } from 'learn-card-base/svgs/wallet/SkillsIcon';

import {
    formatClrDate,
    getLinkedCompetencies,
} from 'learn-card-base/helpers/credentials/clr/renderer';
import { gradeColor, groupByTerm } from 'learn-card-base/helpers/credentials/clr/helpers';

import type {
    CourseDisplayModel,
    CompetencyDisplayModel,
    AssociationDisplayModel,
} from 'learn-card-base/helpers/credentials/clr/renderer';

// Size against the transcript, which may be narrower than the viewport in a panel.
// Share the tracks between headings and rows so outcome columns stay aligned.
const COURSE_GRID =
    'grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_20px] gap-x-3 ' +
    '@min-[420px]:grid-cols-[minmax(0,1.5fr)_minmax(72px,0.6fr)_minmax(120px,1fr)_20px] ' +
    '@min-[560px]:grid-cols-[minmax(0,1.5fr)_28px_28px_minmax(80px,0.6fr)_minmax(144px,1fr)_20px]';

const ClrCourseTable: React.FC<{
    courses: CourseDisplayModel[];
    onSelectCourse?: (course: CourseDisplayModel) => void;
    selectedCourseId?: string;
    adminMode?: boolean;
    competencies?: CompetencyDisplayModel[];
    associations?: AssociationDisplayModel[];
}> = ({
    courses,
    onSelectCourse,
    selectedCourseId,
    adminMode = false,
    competencies = [],
    associations = [],
}) => {
    const groups = groupByTerm(courses);
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

    const toggle = (label: string) =>
        setCollapsed(prev => {
            const next = new Set(prev);
            if (next.has(label)) {
                next.delete(label);
            } else {
                next.add(label);
            }
            return next;
        });

    return (
        <div className="@container space-y-v3-4">
            {groups.map(({ label, courses: gc }) => {
                const isCollapsed = collapsed.has(label);
                const termCredits = summarizeClrCredits(gc);

                return (
                    <div
                        key={label}
                        className="bg-white border border-grayscale-200 rounded-[20px] overflow-hidden"
                    >
                        {/* Term accordion header */}
                        <button
                            className="w-full flex items-center justify-between px-5 py-2 bg-grayscale-50 transition-colors"
                            onClick={() => toggle(label)}
                        >
                            <span className="text-xs font-semibold text-grayscale-900 ">
                                {label}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-right text-xs text-grayscale-600">
                                    {gc.length} course{gc.length !== 1 ? 's' : ''}
                                    {termCredits.map(total => (
                                        <span
                                            key={`${total.kind}-${total.unit ?? ''}`}
                                            className="block"
                                        >
                                            {formatClrCreditTotal(total)}
                                        </span>
                                    ))}
                                </span>
                                {isCollapsed ? (
                                    <ChevronRight className="w-5 h-5 text-grayscale-600" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-grayscale-600" />
                                )}
                            </div>
                        </button>

                        {/* Rows */}
                        {!isCollapsed && (
                            <div className="border-t border-grayscale-100">
                                <div
                                    className={`${COURSE_GRID} hidden @min-[420px]:grid px-3 @min-[560px]:px-5 py-2 bg-white border-b border-grayscale-100`}
                                >
                                    <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wider">
                                        Course
                                    </p>
                                    <p className="hidden @min-[560px]:block text-xs font-semibold text-grayscale-500 uppercase tracking-wider text-center">
                                        {/* Skills */}
                                    </p>
                                    <p className="hidden @min-[560px]:block text-xs font-semibold text-grayscale-500 uppercase tracking-wider text-center">
                                        {/* Evidence */}
                                    </p>
                                    <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wider text-right">
                                        Credits
                                    </p>
                                    <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wider text-right">
                                        Results
                                    </p>
                                    <div />
                                </div>
                                {gc.map(course => {
                                    const results = course.results.filter(
                                        result =>
                                            result.value !== undefined ||
                                            result.status !== undefined ||
                                            result.achievedLevelId !== undefined
                                    );
                                    const competencyCount = getLinkedCompetencies(
                                        course.sourceCredentialId,
                                        competencies,
                                        associations
                                    ).length;
                                    const evidenceCount = course.evidence.length;
                                    const isSelected =
                                        course.sourceCredentialId === selectedCourseId;

                                    return (
                                        <button
                                            key={course.sourceCredentialId}
                                            className={`${COURSE_GRID} w-full gap-y-2 px-3 @min-[560px]:px-5 py-3.5 border-b border-grayscale-100 last:border-0 transition-colors text-left items-center odd:bg-white even:bg-grayscale-50`}
                                            onClick={() => onSelectCourse?.(course)}
                                        >
                                            {/* Course name + code */}
                                            <div className="col-span-2 min-w-0 @min-[420px]:col-span-1">
                                                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                                    {course.humanCode?.value && (
                                                        <span className="text-xs font-semibold text-grayscale-600 shrink-0">
                                                            {course.humanCode.value}
                                                        </span>
                                                    )}
                                                    <span className="text-xs font-medium text-grayscale-900 wrap-anywhere leading-snug">
                                                        {course.name?.value ?? 'Course'}
                                                    </span>
                                                </div>
                                                {adminMode && course.earnedAt?.value && (
                                                    <p className="text-[10px] text-grayscale-400 mt-0.5">
                                                        {formatClrDate(course.earnedAt.value)}
                                                    </p>
                                                )}
                                            </div>
                                            {/* Linked competencies (skills) */}
                                            <div className="hidden @min-[560px]:flex items-center justify-center gap-1.5">
                                                {competencyCount > 0 ? (
                                                    <>
                                                        <span className="text-xs text-grayscale-600">
                                                            {competencyCount}
                                                        </span>
                                                        <SkillsIcon className="w-4 h-4 text-grayscale-500" />
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-grayscale-300">
                                                        —
                                                    </span>
                                                )}
                                            </div>
                                            {/* Evidence */}
                                            <div className="hidden @min-[560px]:flex items-center justify-center gap-1.5">
                                                {evidenceCount > 0 ? (
                                                    <>
                                                        <span className="text-xs text-grayscale-600">
                                                            {evidenceCount}
                                                        </span>
                                                        <Paperclip className="w-4 h-4 text-grayscale-500" />
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-grayscale-300">
                                                        —
                                                    </span>
                                                )}
                                            </div>
                                            {/* Credits */}
                                            <div className="min-w-0 @min-[420px]:text-right">
                                                <ClrCreditValues course={course} />
                                            </div>
                                            {/* Grade */}
                                            <div className="min-w-0 flex justify-end items-center">
                                                {results.length > 0 ? (
                                                    <div className="w-full min-w-0 space-y-1">
                                                        {results.map((result, index) => {
                                                            const value = String(
                                                                getResultDisplayValue(result)
                                                            );
                                                            const label = getClrResultLabel(result);
                                                            const isGrade =
                                                                result.resultType?.value ===
                                                                    'LetterGrade' ||
                                                                result.resultType?.value ===
                                                                    'Grade';
                                                            return (
                                                                <div
                                                                    key={`${result.resultDescriptionId?.value ?? 'result'}-${index}`}
                                                                    className="flex items-baseline justify-end gap-2"
                                                                >
                                                                    <p className="min-w-0 wrap-anywhere text-right text-[10px] text-grayscale-500">
                                                                        {label}
                                                                    </p>
                                                                    <span
                                                                        title={value}
                                                                        className={`min-w-0 max-w-full truncate text-right text-xs font-bold ${isGrade ? gradeColor(value) : 'text-grayscale-900'}`}
                                                                    >
                                                                        {value}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-grayscale-300">
                                                        —
                                                    </span>
                                                )}
                                            </div>
                                            {/* Row arrow */}
                                            <ChevronRight className="col-start-3 row-start-1 row-span-2 w-5 h-5 text-grayscale-400 justify-self-end self-center @min-[420px]:col-start-auto @min-[420px]:row-start-auto @min-[420px]:row-span-1" />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ClrCourseTable;
