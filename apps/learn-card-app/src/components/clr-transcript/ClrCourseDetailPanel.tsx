import type { AssociationDisplayModel, CourseDisplayModel } from '../../helpers/clrRenderer.helpers';
import { formatClrDate } from '../../helpers/clrRenderer.helpers';
import ClrTranscriptResultsList from './ClrTranscriptResultsList';
import ClrProvenanceTable from './ClrProvenanceTable';
import { gradeColor } from './ClrCourseTable';

type Props = {
    course: CourseDisplayModel | null;
    onClose: () => void;
    adminMode?: boolean;
    associations?: AssociationDisplayModel[];
};

const ClrCourseDetailPanel = ({ course, onClose, adminMode = false, associations = [] }: Props) => {
    const primaryResult = course?.results.find(r => r.value);
    const grade = primaryResult ? String(primaryResult.value.value) : undefined;
    const credits = course
        ? (course.creditsEarned?.value ?? course.creditsAvailable?.value)
        : undefined;

    const id = course?.sourceCredentialId;
    const prerequisites = associations.filter(
        a => a.associationType === 'precedes' && a.targetId === id && a.sourceName
    );
    const partOf = associations.filter(
        a => a.associationType === 'isChildOf' && a.sourceId === id && a.targetName
    );

    return (
        <>
            {/* Backdrop — closes panel on click */}
            {course && (
                <div
                    className="fixed inset-0 bg-black/20 z-40"
                    onClick={onClose}
                />
            )}

            {/* Side panel */}
            <div
                className={`fixed inset-y-0 right-0 w-full max-w-[420px] bg-white border-l border-grayscale-200 shadow-2xl overflow-y-auto z-50 transition-transform duration-200 ease-out ${
                    course ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {course && (
                    <div className="p-5 space-y-5 pb-10">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 pt-1">
                            <div className="flex-1 min-w-0">
                                {course.humanCode?.value && (
                                    <p className="text-xs font-mono text-grayscale-400 mb-0.5">
                                        {course.humanCode.value}
                                    </p>
                                )}
                                <p className="text-base font-semibold text-grayscale-900 leading-tight">
                                    {course.name?.value ?? 'Course Details'}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <p className="text-xs text-grayscale-500">
                                        {course.achievementType.value}
                                    </p>
                                    {course.fieldOfStudy?.value && (
                                        <>
                                            <span className="text-xs text-grayscale-300">·</span>
                                            <p className="text-xs text-grayscale-500">
                                                {course.fieldOfStudy.value}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-grayscale-100 text-grayscale-500 text-sm transition-colors mt-0.5"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Grade + credits hero */}
                        {(grade !== undefined || credits !== undefined) && (
                            <div className="flex gap-3">
                                {grade !== undefined && (
                                    <div
                                        className={`flex flex-col items-center rounded-2xl px-6 py-4 ${gradeColor(grade)}`}
                                    >
                                        <p className="text-3xl font-bold leading-none">{grade}</p>
                                        <p className="text-xs opacity-70 mt-1">
                                            {primaryResult?.label?.value ?? 'Grade'}
                                        </p>
                                    </div>
                                )}
                                {credits !== undefined && (
                                    <div className="flex flex-col items-center bg-grayscale-50 border border-grayscale-200 rounded-2xl px-6 py-4">
                                        <p className="text-3xl font-bold text-grayscale-900 leading-none">
                                            {credits}
                                        </p>
                                        <p className="text-xs text-grayscale-500 mt-1">
                                            {course.creditsEarned !== undefined ? 'earned' : 'available'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        {course.description?.value && (
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-grayscale-600 uppercase tracking-wide">
                                    Description
                                </p>
                                <p className="text-sm text-grayscale-700 leading-relaxed">
                                    {course.description.value}
                                </p>
                            </div>
                        )}

                        {/* Part of program */}
                        {partOf.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-grayscale-600 uppercase tracking-wide">
                                    Part of
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {partOf.map(a => (
                                        <span
                                            key={a.targetId}
                                            className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-0.5"
                                        >
                                            {a.targetName}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Prerequisites */}
                        {prerequisites.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-grayscale-600 uppercase tracking-wide">
                                    Prerequisites
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {prerequisites.map(a => (
                                        <span
                                            key={a.sourceId}
                                            className="text-xs text-grayscale-700 bg-grayscale-100 border border-grayscale-200 rounded-full px-2.5 py-0.5"
                                        >
                                            {a.sourceName}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Dates */}
                        {(course.earnedAt?.value || course.validUntil?.value) && (
                            <div className="grid grid-cols-2 gap-4">
                                {course.earnedAt?.value && (
                                    <div>
                                        <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wide mb-0.5">
                                            Earned
                                        </p>
                                        <p className="text-sm text-grayscale-900">
                                            {formatClrDate(course.earnedAt.value)}
                                        </p>
                                    </div>
                                )}
                                {course.validUntil?.value && (
                                    <div>
                                        <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wide mb-0.5">
                                            Expires
                                        </p>
                                        <p className="text-sm text-grayscale-900">
                                            {formatClrDate(course.validUntil.value)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* All results */}
                        {course.results.length > 0 && (
                            <div className="space-y-2.5">
                                <p className="text-xs font-semibold text-grayscale-600 uppercase tracking-wide">
                                    Results
                                </p>
                                <ClrTranscriptResultsList
                                    results={course.results}
                                    showResultType={adminMode}
                                />
                            </div>
                        )}

                        {/* Admin provenance */}
                        {adminMode && (
                            <>
                                <div className="border-t border-grayscale-200" />
                                <ClrProvenanceTable course={course} />
                            </>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default ClrCourseDetailPanel;
