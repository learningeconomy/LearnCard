import React from 'react';

import type { ClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';
import { ClrRecordDetails } from './ClrRecordDetails';
import ClrAlignmentList from './ClrAlignmentList';
import ClrRelationshipChips from './ClrRelationshipChips';
import ClrTranscriptEvidenceList from './ClrTranscriptEvidenceList';
import ClrResultWithScaleList from './ClrResultWithScaleList';

/** Keeps mixed and nonacademic children visible alongside the transcript's academic records. */
export const ClrOtherRecordsSection = ({
    model,
    showSource = false,
    onSelectRecord,
}: {
    model: ClrTranscriptDisplayModel;
    showSource?: boolean;
    onSelectRecord?: (id: string) => void;
}) => {
    if (!model.otherRecords.length) return null;

    return (
        <section aria-label="Other records" className="space-y-3">
            <div className="flex items-center justify-between border-b border-grayscale-100 px-1 pb-2">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-grayscale-500">
                    Other Records
                </h3>
                <p className="text-xs text-grayscale-500">
                    {model.otherRecords.length} item{model.otherRecords.length !== 1 ? 's' : ''}
                </p>
            </div>
            {model.otherRecords.map(other => (
                <div
                    key={other.sourceCredentialId}
                    className="space-y-3 rounded-[20px] border border-grayscale-200 bg-white p-4"
                >
                    <h4 className="text-base font-semibold text-grayscale-900">
                        {onSelectRecord ? (
                            <button
                                type="button"
                                className="text-left hover:underline"
                                onClick={() => onSelectRecord(other.sourceCredentialId)}
                            >
                                {other.name?.value || 'Record'}
                            </button>
                        ) : (
                            other.name?.value || 'Record'
                        )}
                    </h4>
                    {other.description?.value && (
                        <p className="text-sm leading-relaxed text-grayscale-600">
                            {other.description.value}
                        </p>
                    )}
                    <ClrResultWithScaleList results={other.results} showResultType={showSource} />
                    <ClrAlignmentList alignments={other.alignments} />
                    <ClrTranscriptEvidenceList evidence={other.evidence} />
                    <ClrRelationshipChips
                        relationships={model.relationships[other.sourceCredentialId] ?? []}
                        onSelectRecord={onSelectRecord}
                    />
                    <ClrRecordDetails
                        record={model.records.find(
                            record => record.id === other.sourceCredentialId
                        )}
                    />
                </div>
            ))}
        </section>
    );
};
