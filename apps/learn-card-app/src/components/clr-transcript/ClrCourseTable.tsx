import React, { useState } from 'react';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { AwardDisplayIcon } from 'learn-card-base/svgs/displayTypes/AwardDisplayIcon';

import { formatClrDate } from '../../helpers/clrRenderer.helpers';
import { gradeColor, groupByTerm } from './clr.helpers';

import type { CourseDisplayModel } from '../../helpers/clrRenderer.helpers';

const ClrCourseTable: React.FC<{
    courses: CourseDisplayModel[];
    onSelectCourse?: (course: CourseDisplayModel) => void;
    selectedCourseId?: string;
    adminMode?: boolean;
}> = ({ courses, onSelectCourse, selectedCourseId, adminMode = false }) => {
    const groups = groupByTerm(courses);
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

    const toggle = (label: string) =>
        setCollapsed(prev => {
            const next = new Set(prev);
            next.has(label) ? next.delete(label) : next.add(label);
            return next;
        });

    return (
        <div className="space-y-4">
            {groups.map(({ label, courses: gc }) => {
                const isCollapsed = collapsed.has(label);
                const termCredits = gc.reduce<number>(
                    (s, c) => s + (c.creditsEarned?.value ?? c.creditsAvailable?.value ?? 0),
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
                            <span className="text-[15px] font-semibold text-grayscale-900 ">
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
                                <div className="grid grid-cols-[1fr_96px_64px_56px_24px] px-5 py-2 bg-white border-b border-grayscale-100">
                                    <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wider">
                                        Course
                                    </p>
                                    <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wider text-center">
                                        Credentials
                                    </p>
                                    <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wider text-right">
                                        Credits
                                    </p>
                                    <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wider text-right">
                                        Grade
                                    </p>
                                    <div />
                                </div>
                                {gc.map(course => {
                                    const primaryResult = course.results.find(r => r.value);
                                    const grade = primaryResult
                                        ? String(primaryResult.value.value)
                                        : undefined;
                                    const credits =
                                        course.creditsEarned?.value ??
                                        course.creditsAvailable?.value;
                                    const credentialCount = course.results.length;
                                    const isSelected =
                                        course.sourceCredentialId === selectedCourseId;

                                    return (
                                        <button
                                            key={course.sourceCredentialId}
                                            className={`w-full grid grid-cols-[1fr_96px_64px_56px_24px] px-5 py-3.5 border-b border-grayscale-100 last:border-0 transition-colors text-left items-center odd:bg-white even:bg-grayscale-50`}
                                            onClick={() => onSelectCourse?.(course)}
                                        >
                                            {/* Course name + code */}
                                            <div className="min-w-0 pr-2">
                                                <div className="flex items-baseline gap-2">
                                                    {course.humanCode?.value && (
                                                        <span className="text-sm font-semibold text-grayscale-600 shrink-0">
                                                            {course.humanCode.value}
                                                        </span>
                                                    )}
                                                    <span className="text-sm font-medium text-grayscale-900 truncate leading-snug">
                                                        {course.name?.value ?? 'Course'}
                                                    </span>
                                                </div>
                                                {adminMode && course.earnedAt?.value && (
                                                    <p className="text-[10px] text-grayscale-400 mt-0.5">
                                                        {formatClrDate(course.earnedAt.value)}
                                                    </p>
                                                )}
                                            </div>
                                            {/* Credentials */}
                                            <div className="flex items-center justify-center gap-1.5">
                                                {credentialCount > 0 ? (
                                                    <>
                                                        <span className="text-sm text-grayscale-600">
                                                            {credentialCount}
                                                        </span>
                                                        <AwardDisplayIcon className="w-5 h-5" />
                                                    </>
                                                ) : (
                                                    <span className="text-sm text-grayscale-300">
                                                        —
                                                    </span>
                                                )}
                                            </div>
                                            {/* Credits */}
                                            <p className="text-sm text-grayscale-700 text-right">
                                                {credits ?? '—'}
                                            </p>
                                            {/* Grade */}
                                            <div className="flex justify-end items-center">
                                                {grade !== undefined ? (
                                                    <span
                                                        className={`text-sm font-bold ${gradeColor(
                                                            grade
                                                        )}`}
                                                    >
                                                        {grade}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-grayscale-300">
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
