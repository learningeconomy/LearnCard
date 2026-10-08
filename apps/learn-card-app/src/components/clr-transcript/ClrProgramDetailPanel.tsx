import React, { useState } from 'react';

import X from '../svgs/X';
import { FlatIcon } from 'learn-card-base/components/FlatIcon';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CertificateDisplayIcon } from 'learn-card-base';
import ClrCompetencyBlock from './ClrCompetencyBlock';
import ClrAlignmentList from './ClrAlignmentList';
import ClrRelationshipChips from './ClrRelationshipChips';
import ClrResultWithScaleList from './ClrResultWithScaleList';
import ClrTranscriptEvidenceList, {
    type ClrEvidenceSourceSummary,
} from './ClrTranscriptEvidenceList';
import ClrProgramCredentialCollapsible from './ClrProgramCredentialCollapsible';

import { useModal } from 'learn-card-base';

import { formatAchievementType } from './clr.helpers';
import {
    formatClrDate,
    getLinkedCompetencies,
    getRelationshipsForRecord,
} from '../../helpers/clrRenderer.helpers';
import type {
    ClrTranscriptDisplayModel,
    ProgramDisplayModel,
} from '../../helpers/clrRenderer.helpers';
import type { VC } from '@learncard/types';

const ClrProgramDetailPanel: React.FC<{
    program: ProgramDisplayModel;
    boost: VC;
    model: ClrTranscriptDisplayModel;
    onSelectRecord?: (recordId: string) => void;
    adminMode?: boolean;
    issuerName?: string;
    issuerLogo?: string;
}> = ({ program, boost, model, onSelectRecord, adminMode = false, issuerName, issuerLogo }) => {
    const { closeModal } = useModal();
    const [resultsOpen, setResultsOpen] = useState(true);

    const programCompetencies = getLinkedCompetencies(
        program.sourceCredentialId,
        model.competencies,
        model.associations
    );
    const relationships = getRelationshipsForRecord(
        model.relationships,
        program.sourceCredentialId
    );
    const childIds = new Set(
        relationships
            .filter(relationship => relationship.kind === 'child')
            .map(relationship => relationship.relatedRecordId)
    );
    const childCourses = model.courses.filter(course => childIds.has(course.sourceCredentialId));
    const evidenceSourceSummaries: Record<string, ClrEvidenceSourceSummary> = {
        [program.sourceCredentialId]: {
            kind: 'program',
            title: program.name?.value ?? 'Program',
            dateLabel: program.earnedAt?.value
                ? `Added ${formatClrDate(program.earnedAt.value)}`
                : undefined,
        },
    };

    return (
        <div className="space-y-5 pb-[100px] h-full bg-grayscale-100 overflow-y-scroll">
            {/* Header */}
            <div className="bg-white rounded-b-[30px] overflow-hidden shadow-md px-6 py-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-[22px] text-grayscale-900 leading-tight font-semibold">
                            {program.name?.value ?? 'Program Details'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-base leading-none text-grayscale-600">
                                <FlatIcon>
                                    <CertificateDisplayIcon className="w-4 h-4 !text-grayscale-400" />
                                </FlatIcon>
                            </span>
                            <p className="text-sm text-grayscale-600">
                                {formatAchievementType(program.achievementType.value)}
                            </p>
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
                    {/* Description + dates */}
                    {(program.description?.value ||
                        program.earnedAt?.value ||
                        program.validUntil?.value) && (
                        <div className="space-y-2">
                            {program.description?.value && (
                                <div>
                                    <h3 className="text-lg font-medium text-grayscale-900 mb-2">
                                        Description
                                    </h3>
                                    <p className="text-base text-grayscale-700 leading-relaxed">
                                        {program.description.value}
                                    </p>
                                </div>
                            )}
                            {(program.earnedAt?.value || program.validUntil?.value) && (
                                <div className="flex gap-4 flex-wrap">
                                    {program.earnedAt?.value && (
                                        <div>
                                            <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wide mb-0.5">
                                                Awarded
                                            </p>
                                            <p className="text-base text-grayscale-900">
                                                {formatClrDate(program.earnedAt.value)}
                                            </p>
                                        </div>
                                    )}
                                    {program.validUntil?.value && (
                                        <div>
                                            <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wide mb-0.5">
                                                Expires
                                            </p>
                                            <p className="text-base text-grayscale-900">
                                                {formatClrDate(program.validUntil.value)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {relationships.length > 0 && (
                    <div className="bg-white shadow-box-bottom rounded-2xl p-4">
                        <ClrRelationshipChips
                            relationships={relationships}
                            onSelectRecord={onSelectRecord}
                        />
                    </div>
                )}

                {/* Results collapsible */}
                {program.results.length > 0 && (
                    <div className="bg-white shadow-box-bottom rounded-2xl overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setResultsOpen(o => !o)}
                            className="w-full flex items-center justify-between px-4 py-3.5"
                        >
                            <p className="text-sm font-semibold text-grayscale-900">
                                {program.results.length} Result
                                {program.results.length !== 1 ? 's' : ''}
                            </p>
                            <span className="text-grayscale-600 text-xs">
                                {resultsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </span>
                        </button>
                        {resultsOpen && (
                            <div className="px-4 pb-4">
                                <ClrResultWithScaleList
                                    results={program.results}
                                    showResultType={adminMode}
                                />
                            </div>
                        )}
                    </div>
                )}

                {childCourses.length > 0 && (
                    <div className="space-y-3 rounded-2xl border border-grayscale-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-grayscale-600">
                            Courses in this program
                        </p>
                        {childCourses.map(course => {
                            const courseLabel = (
                                <>
                                    <p className="text-sm font-medium text-grayscale-900">
                                        {course.name?.value ?? 'Course'}
                                    </p>
                                    {course.humanCode?.value && (
                                        <p className="text-xs text-grayscale-500">
                                            {course.humanCode.value}
                                        </p>
                                    )}
                                </>
                            );

                            return (
                                <div
                                    key={course.sourceCredentialId}
                                    className="rounded-2xl border border-grayscale-200 bg-grayscale-50 p-3"
                                >
                                    {onSelectRecord ? (
                                        <button
                                            type="button"
                                            className="mb-2 w-full text-left"
                                            onClick={() =>
                                                onSelectRecord(course.sourceCredentialId)
                                            }
                                        >
                                            {courseLabel}
                                        </button>
                                    ) : (
                                        <div className="mb-2">{courseLabel}</div>
                                    )}
                                    <ClrResultWithScaleList results={course.results} compact />
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Competencies linked to this program */}
                {programCompetencies.length > 0 && (
                    <div className="bg-white border border-grayscale-200 rounded-2xl p-4 space-y-4">
                        <p className="text-xs font-semibold text-grayscale-600 uppercase tracking-wide">
                            {programCompetencies.length} Competenc
                            {programCompetencies.length === 1 ? 'y' : 'ies'}
                        </p>
                        <div className="space-y-4">
                            {programCompetencies.map(c => (
                                <ClrCompetencyBlock
                                    key={c.sourceCredentialId}
                                    competency={c}
                                    relationships={getRelationshipsForRecord(
                                        model.relationships,
                                        c.sourceCredentialId
                                    )}
                                    onSelectRecord={onSelectRecord}
                                    adminMode={adminMode}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Aligned competency frameworks (achievement.alignment) */}
                {program.alignments.length > 0 && (
                    <ClrAlignmentList alignments={program.alignments} />
                )}

                {/* Evidence & attachments scoped to this program */}
                {program.evidence.length > 0 && (
                    <div className="bg-white border border-grayscale-200 rounded-2xl p-4">
                        <ClrTranscriptEvidenceList
                            evidence={program.evidence}
                            sourceSummaries={evidenceSourceSummaries}
                        />
                    </div>
                )}

                {/* Source credential collapsible */}
                <ClrProgramCredentialCollapsible
                    program={program}
                    issuerName={issuerName}
                    issuerLogo={issuerLogo}
                    skillCount={programCompetencies.length}
                    credential={boost}
                />

                {/* Admin provenance */}
                {adminMode && (
                    <>
                        <div className="border-t border-grayscale-200" />
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-grayscale-600 uppercase tracking-wide">
                                Provenance
                            </p>
                            <p className="text-xs font-mono text-grayscale-400 break-all">
                                {program.sourceCredentialId}
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ClrProgramDetailPanel;
