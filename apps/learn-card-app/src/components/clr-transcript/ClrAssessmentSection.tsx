import React from 'react';

import { ChevronRight, Target } from 'lucide-react';

import { ClrRubricProgress } from './ClrRubricScale';
import { formatClrDate } from '../../helpers/clrRenderer.helpers';
import { summarizeAssessment } from './clr.helpers';

import type { AssessmentDisplayModel } from '../../helpers/clrRenderer.helpers';

const ClrAssessmentSection: React.FC<{
    assessments: AssessmentDisplayModel[];
    onSelectAssessment: (assessment: AssessmentDisplayModel) => void;
    adminMode?: boolean;
}> = ({ assessments, onSelectAssessment, adminMode = false }) => {
    if (assessments.length === 0) return null;

    return (
        <div id="assessments" className="space-y-3 scroll-mt-6">
            <div className="flex items-center justify-between px-1 border-b border-grayscale-100 pb-2 mb-4">
                <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-widest">
                    Assessments
                </p>
                <p className="text-xs text-grayscale-500">
                    {assessments.length} assessment{assessments.length !== 1 ? 's' : ''}
                </p>
            </div>

            <div className="bg-white border border-grayscale-200 rounded-[20px] overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_24px] px-3 sm:px-5 py-2 bg-grayscale-50 border-b border-grayscale-100">
                    <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wider">
                        Assessment
                    </p>
                    <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wider text-right">
                        Result
                    </p>
                    <div />
                </div>

                {assessments.map(assessment => {
                    const summary = summarizeAssessment(assessment);

                    return (
                        <button
                            key={assessment.sourceCredentialId}
                            type="button"
                            className="w-full grid grid-cols-[1fr_auto_24px] px-3 sm:px-5 py-3.5 border-b border-grayscale-100 last:border-0 text-left items-center odd:bg-white even:bg-grayscale-50 transition-colors"
                            onClick={() => onSelectAssessment(assessment)}
                        >
                            <div className="min-w-0 pr-3">
                                <p className="text-sm font-medium text-grayscale-900 truncate leading-snug">
                                    {assessment.name?.value ?? 'Assessment'}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-grayscale-500 flex-wrap">
                                    <span>{summary.detail}</span>
                                    {assessment.alignments.length > 0 && (
                                        <>
                                            <span className="text-grayscale-300">•</span>
                                            <span className="inline-flex items-center gap-1">
                                                <Target className="w-3 h-3" />
                                                {assessment.alignments.length} aligned
                                            </span>
                                        </>
                                    )}
                                    {adminMode && assessment.earnedAt?.value && (
                                        <>
                                            <span className="text-grayscale-300">•</span>
                                            <span>{formatClrDate(assessment.earnedAt.value)}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-1 shrink-0">
                                <span className="text-sm font-bold text-grayscale-900">
                                    {summary.headline}
                                </span>
                                {summary.progress && (
                                    <ClrRubricProgress
                                        levels={summary.progress.levels}
                                        achieved={summary.progress.achieved}
                                    />
                                )}
                            </div>

                            <ChevronRight className="w-5 h-5 text-grayscale-400 justify-self-end self-center" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ClrAssessmentSection;
