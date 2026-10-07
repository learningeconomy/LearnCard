import {
    getClrResultLabel,
    getResultDisplayValue,
} from 'learn-card-base/helpers/credentials/clr/presentation';
import React, { useState } from 'react';

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
        <div className="space-y-4">
            {groups.map(({ label, courses: gc }) => {
                const isCollapsed = collapsed.has(label);
                const termCredits = gc.reduce<number>(
                    (s, c) =>
                        s +
                        (c.creditsEarned?.value ??
                            c.creditsAvailable?.value ??
                            c.creditsFromDescription?.value ??
                            0),
                    0
                );

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
                                <span className="text-xs text-grayscale-600">
                                    {gc.length} course{gc.length !== 1 ? 's' : ''}
                                    {termCredits > 0 && `, ${termCredits} credits`}
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
                                <div className="grid grid-cols-[minmax(0,1fr)_64px_72px_24px] sm:grid-cols-[minmax(0,1fr)_80px_80px_64px_80px_24px] px-3 sm:px-5 py-2 bg-white border-b border-grayscale-100">
                                    <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wider">
                                        Course
                                    </p>
                                    <p className="hidden sm:block text-xs font-semibold text-grayscale-500 uppercase tracking-wider text-center">
                                        {/* Skills */}
                                    </p>
                                    <p className="hidden sm:block text-xs font-semibold text-grayscale-500 uppercase tracking-wider text-center">
                                        {/* Evidence */}
                                    </p>
                                    <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wider text-right">
                                        Credits
                                    </p>
                                    <p className="pl-2 text-xs font-semibold text-grayscale-500 uppercase tracking-wider text-right">
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
                                    const credits =
                                        course.creditsEarned?.value ??
                                        course.creditsAvailable?.value ??
                                        course.creditsFromDescription?.value;
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
                                            className={`w-full grid grid-cols-[minmax(0,1fr)_64px_72px_24px] sm:grid-cols-[minmax(0,1fr)_80px_80px_64px_80px_24px] px-3 sm:px-5 py-3.5 border-b border-grayscale-100 last:border-0 transition-colors text-left items-center odd:bg-white even:bg-grayscale-50`}
                                            onClick={() => onSelectCourse?.(course)}
                                        >
                                            {/* Course name + code */}
                                            <div className="min-w-0 pr-2">
                                                <div className="flex items-baseline gap-2">
                                                    {course.humanCode?.value && (
                                                        <span className="text-xs font-semibold text-grayscale-600 shrink-0">
                                                            {course.humanCode.value}
                                                        </span>
                                                    )}
                                                    <span className="text-xs font-medium text-grayscale-900 truncate leading-snug">
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
                                            <div className="hidden sm:flex items-center justify-center gap-1.5">
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
                                            <div className="hidden sm:flex items-center justify-center gap-1.5">
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
                                            <p className="text-xs text-grayscale-700 text-right">
                                                {credits ?? '—'}
                                            </p>
                                            {/* Grade */}
                                            <div className="min-w-0 pl-2 flex justify-end items-center">
                                                {results.length > 0 ? (
                                                    <div className="min-w-0 space-y-2 pl-2">
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
                                                                >
                                                                    <p className="break-words text-right text-[10px] text-grayscale-500">
                                                                        {label}
                                                                    </p>
                                                                    <span
                                                                        title={value}
                                                                        className={`block max-w-full truncate text-right text-xs font-bold ${isGrade ? gradeColor(value) : 'text-grayscale-900'}`}
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
                                            <ChevronRight className="w-5 h-5 text-grayscale-400 justify-self-end self-center" />
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
