import { useState } from 'react';
import type { CourseDisplayModel } from '../../helpers/clrRenderer.helpers';
import { formatClrDate } from '../../helpers/clrRenderer.helpers';

type Props = {
    courses: CourseDisplayModel[];
    onSelectCourse?: (course: CourseDisplayModel) => void;
    selectedCourseId?: string;
    adminMode?: boolean;
};

export const gradeColor = (grade: string): string => {
    if (/^A/.test(grade)) return 'text-emerald-700 bg-emerald-50';
    if (/^B/.test(grade)) return 'text-blue-700 bg-blue-50';
    if (/^C/.test(grade)) return 'text-amber-700 bg-amber-50';
    if (/^[DF]/.test(grade)) return 'text-red-700 bg-red-50';
    return 'text-grayscale-700 bg-grayscale-100';
};

// Display-level grouping only — not stored in model, not a semantic inference.
const deriveDisplayTerm = (isoDate: string): string => {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return 'Undated';
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    if (m <= 5) return `Spring ${y}`;
    if (m <= 7) return `Summer ${y}`;
    return `Fall ${y}`;
};

type TermGroup = { label: string; courses: CourseDisplayModel[] };

const groupByTerm = (courses: CourseDisplayModel[]): TermGroup[] => {
    const map = new Map<string, CourseDisplayModel[]>();
    for (const course of courses) {
        const label = course.term?.value
            ? course.term.value
            : course.earnedAt?.value
              ? deriveDisplayTerm(course.earnedAt.value)
              : 'Undated';
        if (!map.has(label)) map.set(label, []);
        map.get(label)!.push(course);
    }
    return Array.from(map.entries()).map(([label, c]) => ({ label, courses: c }));
};

const ClrCourseTable = ({ courses, onSelectCourse, selectedCourseId, adminMode = false }: Props) => {
    const groups = groupByTerm(courses);
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

    const toggle = (label: string) =>
        setCollapsed(prev => {
            const next = new Set(prev);
            next.has(label) ? next.delete(label) : next.add(label);
            return next;
        });

    return (
        <div className="space-y-2">
            {groups.map(({ label, courses: gc }) => {
                const isCollapsed = collapsed.has(label);
                const termCredits = gc.reduce<number>(
                    (s, c) => s + (c.creditsEarned?.value ?? c.creditsAvailable?.value ?? 0),
                    0
                );

                return (
                    <div key={label} className="bg-white border border-grayscale-200 rounded-[20px] overflow-hidden">
                        {/* Term accordion header */}
                        <button
                            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-grayscale-50 transition-colors"
                            onClick={() => toggle(label)}
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="text-sm font-semibold text-grayscale-900">{label}</span>
                                <span className="text-xs text-grayscale-400">
                                    {gc.length} course{gc.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                {termCredits > 0 && (
                                    <span className="text-xs font-medium text-grayscale-600">
                                        {termCredits} cr
                                    </span>
                                )}
                                <span className="text-xs text-grayscale-400">
                                    {isCollapsed ? '›' : '⌄'}
                                </span>
                            </div>
                        </button>

                        {/* Rows */}
                        {!isCollapsed && (
                            <div className="border-t border-grayscale-100">
                                <div className="grid grid-cols-[1fr_48px_52px] px-5 py-2 bg-grayscale-50 border-b border-grayscale-100">
                                    <p className="text-[10px] font-semibold text-grayscale-400 uppercase tracking-wider">Course</p>
                                    <p className="text-[10px] font-semibold text-grayscale-400 uppercase tracking-wider text-right">Cr</p>
                                    <p className="text-[10px] font-semibold text-grayscale-400 uppercase tracking-wider text-right">Grade</p>
                                </div>
                                {gc.map(course => {
                                    const primaryResult = course.results.find(r => r.value);
                                    const grade = primaryResult ? String(primaryResult.value.value) : undefined;
                                    const credits = course.creditsEarned?.value ?? course.creditsAvailable?.value;
                                    const isSelected = course.sourceCredentialId === selectedCourseId;

                                    return (
                                        <button
                                            key={course.sourceCredentialId}
                                            className={`w-full grid grid-cols-[1fr_48px_52px] px-5 py-3 border-b border-grayscale-100 last:border-0 hover:bg-grayscale-50 transition-colors text-left ${
                                                isSelected ? 'bg-blue-50 hover:bg-blue-50' : ''
                                            }`}
                                            onClick={() => onSelectCourse?.(course)}
                                        >
                                            {/* Course name + code */}
                                            <div className="min-w-0 pr-2">
                                                <div className="flex items-baseline gap-1.5">
                                                    {course.humanCode?.value && (
                                                        <span className="text-[10px] font-mono text-grayscale-400 shrink-0">
                                                            {course.humanCode.value}
                                                        </span>
                                                    )}
                                                    <span className="text-sm text-grayscale-900 truncate leading-snug">
                                                        {course.name?.value ?? 'Course'}
                                                    </span>
                                                </div>
                                                {adminMode && course.earnedAt?.value && (
                                                    <p className="text-[10px] text-grayscale-400 mt-0.5">
                                                        {formatClrDate(course.earnedAt.value)}
                                                    </p>
                                                )}
                                            </div>
                                            {/* Credits */}
                                            <p className="text-sm text-grayscale-600 text-right self-center">
                                                {credits ?? '—'}
                                            </p>
                                            {/* Grade badge */}
                                            <div className="flex justify-end items-center">
                                                {grade !== undefined ? (
                                                    <span
                                                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${gradeColor(grade)}`}
                                                    >
                                                        {grade}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-grayscale-300">—</span>
                                                )}
                                            </div>
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
