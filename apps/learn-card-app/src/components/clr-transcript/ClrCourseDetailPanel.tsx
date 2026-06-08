import React, { useState } from 'react';

import X from '../svgs/X';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FlatIcon } from './ClrStatCard';
import ClrCompetencyBlock from './ClrCompetencyBlock';
import ClrGradeScale from './ClrGradeScale';
import ClrProvenanceTable from './ClrProvenanceTable';
import ClrAlignmentList from './ClrAlignmentList';
import ClrTranscriptEvidenceList from './ClrTranscriptEvidenceList';
import { CertificateDisplayIcon } from 'learn-card-base';
import { StudiesIcon } from 'learn-card-base/svgs/wallet/StudiesIcon';
import ClrCourseCredentialCollapsible from './ClrCourseCredentialCollapsible';

import { useModal } from 'learn-card-base';

import type {
    CourseDisplayModel,
    CompetencyDisplayModel,
    AssociationDisplayModel,
} from '../../helpers/clrRenderer.helpers';
import { gradeColor } from './clr.helpers';
import { formatClrDate, getLinkedCompetencies } from '../../helpers/clrRenderer.helpers';
import type { VC } from '@learncard/types';

const ClrCourseDetailPanel: React.FC<{
    course: CourseDisplayModel;
    boost: VC;
    adminMode?: boolean;
    associations?: AssociationDisplayModel[];
    competencies?: CompetencyDisplayModel[];
    issuerName?: string;
    issuerLogo?: string;
}> = ({
    course,
    boost,
    adminMode = false,
    associations = [],
    competencies = [],
    issuerName,
    issuerLogo,
}) => {
    const { closeModal } = useModal();
    const [competenciesOpen, setCompetenciesOpen] = useState(true);

    const primaryResult = course.results.find(r => r.value);
    const grade = primaryResult ? String(primaryResult.value.value) : undefined;
    const credits = course.creditsEarned?.value ?? course.creditsAvailable?.value;
    const gradeLabel = primaryResult?.label?.value ?? 'Letter Grade';

    const id = course.sourceCredentialId;
    const prerequisites = associations.filter(
        a => a.associationType === 'precedes' && a.targetId === id && a.sourceName
    );
    const partOf = associations.filter(
        a => a.associationType === 'isChildOf' && a.sourceId === id && a.targetName
    );

    // Competencies linked to this course via explicit CLR associations (no heuristics).
    const courseCompetencies = getLinkedCompetencies(id, competencies, associations);

    // Grade scale from allowedValues on the primary result
    const allowedGrades = primaryResult?.allowedValue?.value ?? [];

    return (
        <div className="space-y-5 pb-10 h-full bg-grayscale-100 overflow-y-auto">
            {/* Header */}
            <div className="bg-white rounded-b-[30px] overflow-hidden shadow-md px-6 py-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        {course.humanCode?.value && (
                            <p className="text-[17px] font-semibold text-grayscale-600 mb-0.5">
                                {course.humanCode.value}
                            </p>
                        )}
                        <p className="text-[22px] text-grayscale-900 leading-tight font-semibold">
                            {course.name?.value ?? 'Course Details'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-base leading-none text-grayscale-600">
                                <FlatIcon>
                                    <StudiesIcon className="w-4 h-4" />
                                </FlatIcon>
                            </span>
                            <p className="text-sm text-grayscale-600">
                                {course.achievementType.value}
                            </p>
                            {course.fieldOfStudy?.value && (
                                <>
                                    <span className="text-xs text-grayscale-300">•</span>
                                    <p className="text-xs text-grayscale-500">
                                        {course.fieldOfStudy.value}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={closeModal}
                        className="shrink-0 w-[50px] h-[50px] flex items-center justify-center rounded-full text-grayscale-600 bg-white border-solid border-grayscale-100 border-[2px] mt-0.5"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="px-5 space-y-5">
                <div className="bg-white shadow-box-bottom rounded-2xl overflow-hidden w-full p-4">
                    {/* Grade + credits hero */}
                    {(grade !== undefined || credits !== undefined) && (
                        <div className="flex gap-3 mb-4">
                            {grade !== undefined && (
                                <div className="bg-grayscale-50 flex flex-col items-center border border-grayscale-200 rounded-2xl px-6 py-4 w-[50%]">
                                    <p
                                        className={`text-3xl font-semibold leading-none ${gradeColor(
                                            grade
                                        )}`}
                                    >
                                        {grade}
                                    </p>
                                    <p className="text-[13px] font-semibold text-grayscale-600 uppercase mt-1.5">
                                        {gradeLabel}
                                    </p>
                                </div>
                            )}
                            {credits !== undefined && (
                                <div className="bg-grayscale-50 flex flex-col items-center border border-grayscale-200 rounded-2xl px-6 py-4 w-[50%]">
                                    <p className="text-3xl font-semibold text-grayscale-900 leading-none">
                                        {credits}
                                    </p>
                                    <p className="text-[13px] font-semibold text-grayscale-600 uppercase mt-1.5">
                                        {course.creditsEarned !== undefined
                                            ? 'Credits'
                                            : 'Available'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Description + earned date */}
                    {(course.description?.value || course.earnedAt?.value) && (
                        <div className="space-y-2">
                            {course.description?.value && (
                                <div>
                                    <h3 className="text-lg font-medium text-grayscale-900 mb-2">
                                        Description
                                    </h3>
                                    <p className="text-sm text-grayscale-700">
                                        {course.description.value}
                                    </p>
                                </div>
                            )}
                            {course.earnedAt?.value && (
                                <p className="text-sm text-grayscale-600">
                                    Earned on{' '}
                                    <span className="font-semibold text-grayscale-600">
                                        {formatClrDate(course.earnedAt.value)}
                                    </span>
                                    {issuerName && (
                                        <>
                                            {' '}
                                            at{' '}
                                            <span className="font-semibold text-grayscale-600">
                                                {issuerName}
                                            </span>
                                        </>
                                    )}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Part of program */}
                    {partOf.length > 0 && (
                        <div className="space-y-2 mt-4 border-t border-grayscale-200 pt-4">
                            <p className="text-xs font-semibold text-grayscale-700 uppercase">
                                Part of Degree Track
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {partOf.map(a => (
                                    <span
                                        key={a.targetId}
                                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-grayscale-800 bg-indigo-50 border border-indigo-300 rounded-full px-3 py-1.5"
                                    >
                                        <CertificateDisplayIcon className="w-4 h-4 !text-grayscale-200" />
                                        {a.targetName}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Prerequisites */}
                    {prerequisites.length > 0 && (
                        <div className="space-y-1.5 mt-4 border-t border-grayscale-200 pt-4">
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

                    {/* Grade scale */}
                    {grade !== undefined && allowedGrades.length > 0 && (
                        <ClrGradeScale grade={grade} allowedGrades={allowedGrades} />
                    )}
                </div>

                {/* Expires */}
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

                {/* Competencies collapsible */}
                {courseCompetencies.length > 0 && (
                    <div className="bg-white border border-grayscale-200 rounded-2xl overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setCompetenciesOpen(o => !o)}
                            className="w-full flex items-center justify-between px-4 py-3.5"
                        >
                            <p className="text-sm font-semibold text-grayscale-900">
                                {courseCompetencies.length} Competenc
                                {courseCompetencies.length === 1 ? 'y' : 'ies'}
                            </p>
                            <span className="text-grayscale-400 text-xs">
                                {competenciesOpen ? (
                                    <ChevronUp size={16} />
                                ) : (
                                    <ChevronDown size={16} />
                                )}
                            </span>
                        </button>
                        {competenciesOpen && (
                            <div className="px-4 pb-4 space-y-4">
                                {courseCompetencies.map(c => (
                                    <ClrCompetencyBlock
                                        key={c.sourceCredentialId}
                                        competency={c}
                                        adminMode={adminMode}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Aligned competency frameworks (achievement.alignment) */}
                {course.alignments.length > 0 && (
                    <ClrAlignmentList alignments={course.alignments} />
                )}

                {/* Evidence & attachments scoped to this course */}
                {course.evidence.length > 0 && (
                    <div className="bg-white border border-grayscale-200 rounded-2xl p-4">
                        <ClrTranscriptEvidenceList evidence={course.evidence} />
                    </div>
                )}

                {/* Source credential collapsible */}
                <ClrCourseCredentialCollapsible
                    course={course}
                    issuerName={issuerName}
                    issuerLogo={issuerLogo}
                    skillCount={courseCompetencies.length}
                    credential={boost}
                />

                {/* Admin provenance */}
                {adminMode && (
                    <>
                        <div className="border-t border-grayscale-200" />
                        <ClrProvenanceTable course={course} />
                    </>
                )}
            </div>
        </div>
    );
};

export default ClrCourseDetailPanel;
