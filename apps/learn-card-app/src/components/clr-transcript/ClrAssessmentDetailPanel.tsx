import React from 'react';

import X from '../svgs/X';
import { ClipboardCheck } from 'lucide-react';
import { FlatIcon } from 'learn-card-base/components/FlatIcon';
import ClrAlignmentList from './ClrAlignmentList';
import ClrRubricScale, { ClrRubricProgress } from './ClrRubricScale';
import ClrTranscriptResultsList from './ClrTranscriptResultsList';
import ClrTranscriptEvidenceList, {
    type ClrEvidenceSourceSummary,
} from './ClrTranscriptEvidenceList';
import ClrCourseCredentialCollapsible from './ClrCourseCredentialCollapsible';

import { useModal } from 'learn-card-base';

import { formatClrDate } from '../../helpers/clrRenderer.helpers';
import { summarizeAssessment } from './clr.helpers';

import type { AssessmentDisplayModel, ResultDisplayModel } from '../../helpers/clrRenderer.helpers';
import type { VC } from '@learncard/types';

const RubricCriterionRow: React.FC<{ result: ResultDisplayModel; striped: boolean }> = ({
    result,
    striped,
}) => {
    const levels = result.rubricLevels ?? [];
    const achieved = result.achievedLevel;

    return (
        <div
            className={`px-5 py-3.5 border-b border-grayscale-100 last:border-0 ${
                striped ? 'bg-grayscale-50' : 'bg-white'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-grayscale-900 leading-snug">
                        {result.label?.value ?? 'Criterion'}
                    </p>
                    {achieved?.description && (
                        <p className="text-xs text-grayscale-600 leading-relaxed mt-1">
                            {achieved.description}
                        </p>
                    )}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            achieved
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                                : 'bg-grayscale-100 border border-grayscale-200 text-grayscale-700'
                        }`}
                    >
                        {achieved?.name ?? String(result.value.value)}
                    </span>
                    {levels.length > 0 && <ClrRubricProgress levels={levels} achieved={achieved} />}
                </div>
            </div>
        </div>
    );
};

const ClrAssessmentDetailPanel: React.FC<{
    assessment: AssessmentDisplayModel;
    boost: VC;
    adminMode?: boolean;
    issuerName?: string;
    issuerLogo?: string;
    showCloseButton?: boolean;
}> = ({ assessment, boost, adminMode = false, issuerName, issuerLogo, showCloseButton = true }) => {
    const { closeModal } = useModal();
    const summary = summarizeAssessment(assessment);
    const rubricLevels = summary.progress?.levels ?? [];

    const evidenceSourceSummaries: Record<string, ClrEvidenceSourceSummary> = {
        [assessment.sourceCredentialId]: {
            kind: 'assessment',
            title: assessment.name?.value ?? 'Assessment',
            dateLabel: assessment.earnedAt?.value
                ? `Added ${formatClrDate(assessment.earnedAt.value)}`
                : undefined,
        },
    };

    return (
        <div className="space-y-5 pb-[100px] h-full bg-grayscale-100 overflow-y-auto mt-[var(--ion-safe-area-top,0px)]">
            <div className="bg-white rounded-b-[30px] overflow-hidden shadow-md px-6 py-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-[22px] text-grayscale-900 leading-tight font-semibold">
                            {assessment.name?.value ?? 'Assessment'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-base leading-none text-grayscale-600">
                                <FlatIcon>
                                    <ClipboardCheck className="w-4 h-4" />
                                </FlatIcon>
                            </span>
                            <p className="text-sm text-grayscale-600">
                                {assessment.achievementType.value}
                            </p>
                            {assessment.earnedAt?.value && (
                                <>
                                    <span className="text-xs text-grayscale-300">•</span>
                                    <p className="text-xs text-grayscale-500">
                                        {formatClrDate(assessment.earnedAt.value)}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                    {showCloseButton && (
                        <button
                            type="button"
                            onClick={closeModal}
                            className="shrink-0 w-[50px] h-[50px] flex items-center justify-center rounded-full text-grayscale-600 bg-white border-solid border-grayscale-100 border-[2px] mt-0.5"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </div>

            <div className="px-5 space-y-5">
                <div className="bg-white shadow-box-bottom rounded-2xl overflow-hidden w-full p-4 space-y-4">
                    <div className="flex gap-3">
                        <div className="bg-grayscale-50 flex flex-col items-center border border-grayscale-200 rounded-2xl px-6 py-4 w-[50%]">
                            <p className="text-2xl font-semibold text-emerald-700 leading-none text-center">
                                {summary.headline}
                            </p>
                            <p className="text-[13px] font-semibold text-grayscale-600 uppercase mt-1.5">
                                {assessment.isRubric ? 'Typical level' : 'Score'}
                            </p>
                        </div>
                        <div className="bg-grayscale-50 flex flex-col items-center border border-grayscale-200 rounded-2xl px-6 py-4 w-[50%]">
                            <p className="text-2xl font-semibold text-grayscale-900 leading-none">
                                {assessment.results.length}
                            </p>
                            <p className="text-[13px] font-semibold text-grayscale-600 uppercase mt-1.5">
                                {assessment.isRubric ? 'Criteria' : 'Scores'}
                            </p>
                        </div>
                    </div>

                    {assessment.description?.value && (
                        <div>
                            <h3 className="text-lg font-medium text-grayscale-900 mb-2">
                                Description
                            </h3>
                            <p className="text-sm text-grayscale-700">
                                {assessment.description.value}
                            </p>
                        </div>
                    )}

                    {assessment.earnedAt?.value && (
                        <p className="text-sm text-grayscale-600">
                            Completed on{' '}
                            <span className="font-semibold text-grayscale-600">
                                {formatClrDate(assessment.earnedAt.value)}
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

                    {assessment.isRubric && rubricLevels.length > 0 && (
                        <div className="border-t border-grayscale-200 pt-4">
                            <ClrRubricScale
                                levels={rubricLevels}
                                achieved={summary.progress?.achieved}
                            />
                        </div>
                    )}
                </div>

                {assessment.isRubric ? (
                    <div className="bg-white border border-grayscale-200 rounded-[20px] overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-2 bg-grayscale-50 border-b border-grayscale-100">
                            <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wider">
                                Criteria
                            </p>
                            <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wider">
                                Level achieved
                            </p>
                        </div>
                        {assessment.results.map((result, index) => (
                            <RubricCriterionRow
                                key={result.resultDescriptionId?.value ?? index}
                                result={result}
                                striped={index % 2 === 1}
                            />
                        ))}
                    </div>
                ) : (
                    <ClrTranscriptResultsList
                        results={assessment.results}
                        showResultType={adminMode}
                    />
                )}

                {assessment.alignments.length > 0 && (
                    <ClrAlignmentList alignments={assessment.alignments} />
                )}

                {assessment.evidence.length > 0 && (
                    <div className="bg-white border border-grayscale-200 rounded-2xl p-4">
                        <ClrTranscriptEvidenceList
                            evidence={assessment.evidence}
                            sourceSummaries={evidenceSourceSummaries}
                        />
                    </div>
                )}

                <ClrCourseCredentialCollapsible
                    course={assessment}
                    issuerName={issuerName}
                    issuerLogo={issuerLogo}
                    skillCount={assessment.alignments.length}
                    credential={boost}
                />
            </div>
        </div>
    );
};

export default ClrAssessmentDetailPanel;
