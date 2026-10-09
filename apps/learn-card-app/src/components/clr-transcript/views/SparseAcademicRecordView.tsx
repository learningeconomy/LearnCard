import React from 'react';
import { ClrRecordDetails } from '../ClrRecordDetails';

import ClrResultWithScaleList from '../ClrResultWithScaleList';
import ClrAwardsSection from '../ClrAwardsSection';
import { ClrOtherRecordsSection } from '../ClrOtherRecordsSection';

import { formatClrDate } from 'learn-card-base/helpers/credentials/clr/renderer';
import type { ClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';

const SparseAcademicRecordView: React.FC<{
    model: ClrTranscriptDisplayModel;
    showSource?: boolean;
    onSelectRecord?: (id: string) => void;
}> = ({ model, showSource = false, onSelectRecord }) => {
    return (
        <div className="space-y-4">
            {model.assessments.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1 border-b border-grayscale-100 pb-2">
                        <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-widest">
                            Assessments
                        </p>
                        <p className="text-xs text-grayscale-500">
                            {model.assessments.length} item
                            {model.assessments.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {model.assessments.map(assessment => (
                        <div
                            key={assessment.sourceCredentialId}
                            className="bg-white border border-grayscale-200 rounded-[20px] overflow-hidden"
                        >
                            <div className="flex items-center justify-between gap-3 px-5 py-2 bg-grayscale-50 border-b border-grayscale-100">
                                <p className="text-[15px] font-semibold text-grayscale-900 truncate">
                                    {assessment.name?.value || 'Assessment'}
                                </p>
                                {assessment.earnedAt?.value && (
                                    <p className="text-xs text-grayscale-500 shrink-0">
                                        {formatClrDate(assessment.earnedAt.value)}
                                    </p>
                                )}
                            </div>

                            <div className="px-5 py-4 space-y-3">
                                {assessment.description?.value && (
                                    <p className="text-sm text-grayscale-600 leading-relaxed">
                                        {assessment.description.value}
                                    </p>
                                )}
                                <ClrRecordDetails
                                    record={model.records.find(
                                        record => record.id === assessment.sourceCredentialId
                                    )}
                                />
                                <ClrResultWithScaleList
                                    results={assessment.results}
                                    showResultType={showSource}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <ClrAwardsSection
                awards={model.awards}
                records={model.records}
                relationships={model.relationships}
                onSelectRecord={onSelectRecord}
                onSelectAward={
                    onSelectRecord ? award => onSelectRecord(award.sourceCredentialId) : undefined
                }
            />
            <ClrOtherRecordsSection
                model={model}
                showSource={showSource}
                onSelectRecord={onSelectRecord}
            />
        </div>
    );
};

export default SparseAcademicRecordView;
