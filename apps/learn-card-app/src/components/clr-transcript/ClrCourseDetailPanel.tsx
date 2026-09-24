import React, { useState } from 'react';

import X from '../svgs/X';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FlatIcon } from 'learn-card-base/components/FlatIcon';
import ClrCompetencyBlock from './ClrCompetencyBlock';
import ClrAlignmentList from './ClrAlignmentList';
import ClrRelationshipChips from './ClrRelationshipChips';
import ClrResultWithScaleList from './ClrResultWithScaleList';
import ClrProvenanceTable from './ClrProvenanceTable';
import ClrTranscriptEvidenceList, {
    type ClrEvidenceSourceSummary,
} from './ClrTranscriptEvidenceList';
import { CertificateDisplayIcon } from 'learn-card-base';
import { StudiesIcon } from 'learn-card-base/svgs/wallet/StudiesIcon';
import ClrCourseCredentialCollapsible from './ClrCourseCredentialCollapsible';

import { useModal } from 'learn-card-base';

import type {
    ClrTranscriptDisplayModel,
    CourseDisplayModel,
} from '../../helpers/clrRenderer.helpers';
import {
    formatClrDate,
    getLinkedCompetencies,
    getRelationshipsForRecord,
    isRecordSuperseded,
} from '../../helpers/clrRenderer.helpers';
import type { VC } from '@learncard/types';

const ClrCourseDetailPanel: React.FC<{
    course: CourseDisplayModel;
    boost: VC;
    model?: ClrTranscriptDisplayModel;
    onSelectRecord?: (recordId: string) => void;
    adminMode?: boolean;
    issuerName?: string;
    issuerLogo?: string;
    showCloseButton?: boolean;
}> = ({
    course,
    boost,
    model,
    onSelectRecord,
    adminMode = false,
    issuerName,
    issuerLogo,
    showCloseButton = true,
}) => {
    const { closeModal } = useModal();
    const [competenciesOpen, setCompetenciesOpen] = useState(true);

    const credits =
        course.creditsEarned?.value ??
        course.creditsAvailable?.value ??
        course.creditsFromDescription?.value;
    const id = course.sourceCredentialId;
    const courseCompetencies = getLinkedCompetencies(
        id,
        model?.competencies ?? [],
        model?.associations ?? []
    );
    const relationships = getRelationshipsForRecord(model?.relationships ?? {}, id);
    const superseded = isRecordSuperseded(model?.relationships ?? {}, id);
    const evidenceSourceSummaries: Record<string, ClrEvidenceSourceSummary> = {
        [course.sourceCredentialId]: {
            kind: 'course',
            title: course.name?.value ?? 'Course',
            humanCode: course.humanCode?.value,
            dateLabel: course.earnedAt?.value
                ? `Added ${formatClrDate(course.earnedAt.value)}`
                : undefined,
        },
    };

    return (
        <div
            className={`space-y-5 pb-[100px] h-full bg-grayscale-100 overflow-y-auto ${
                superseded ? 'opacity-70' : ''
            }`}
        >
            {/* Header */}
            <div className="bg-white rounded-b-[30px] overflow-hidden shadow-md px-6 py-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        {course.humanCode?.value && (
                            <p className="text-base font-semibold text-grayscale-600 mb-0.5">
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
                    {showCloseButton && (
                        <button
                            onClick={closeModal}
                            className="shrink-0 w-[50px] h-[50px] flex items-center justify-center rounded-full text-grayscale-600 bg-white border-solid border-grayscale-100 border-[2px] mt-0.5"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </div>

            <div className="px-5 space-y-5">
                <div className="bg-white shadow-box-bottom rounded-2xl overflow-hidden w-full p-4">
                    {/* Credits summary */}
                    {credits !== undefined && (
                        <div className="mb-4 flex">
                            <div className="flex w-full flex-col items-center rounded-2xl border border-grayscale-200 bg-grayscale-50 px-6 py-4">
                                <p className="text-2xl font-semibold leading-none text-grayscale-900">
                                    {credits}
                                </p>
                                <p className="mt-1.5 text-sm font-semibold uppercase text-grayscale-600">
                                    {course.creditsEarned !== undefined ||
                                    course.creditsFromDescription !== undefined
                                        ? 'Credits'
                                        : 'Available'}
                                </p>
                            </div>
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
                                    <p className="text-base text-grayscale-700 leading-relaxed">
                                        {course.description.value}
                                    </p>
                                </div>
                            )}
                            {course.earnedAt?.value && (
                                <p className="text-base text-grayscale-600">
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

                    {relationships.length > 0 && (
                        <div className="mt-4 border-t border-grayscale-200 pt-4">
                            <ClrRelationshipChips
                                relationships={relationships}
                                onSelectRecord={onSelectRecord}
                            />
                        </div>
                    )}
                </div>

                {course.results.length > 0 && (
                    <ClrResultWithScaleList results={course.results} showResultType={adminMode} />
                )}

                {/* Expires */}
                {course.validUntil?.value && (
                    <div>
                        <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wide mb-0.5">
                            Expires
                        </p>
                        <p className="text-base text-grayscale-900">
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
                                        relationships={getRelationshipsForRecord(
                                            model?.relationships ?? {},
                                            c.sourceCredentialId
                                        )}
                                        onSelectRecord={onSelectRecord}
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
                        <ClrTranscriptEvidenceList
                            evidence={course.evidence}
                            sourceSummaries={evidenceSourceSummaries}
                        />
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
