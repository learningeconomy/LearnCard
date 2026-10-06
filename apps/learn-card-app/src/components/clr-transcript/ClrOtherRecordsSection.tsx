import React from 'react';

import type { ClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';
import { ClrRecordDetails } from './ClrRecordDetails';
import ClrResultWithScaleList from './ClrResultWithScaleList';

/** Keeps mixed and nonacademic children visible alongside the transcript's academic records. */
export const ClrOtherRecordsSection = ({
    model,
    showSource = false,
}: {
    model: ClrTranscriptDisplayModel;
    showSource?: boolean;
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
                        {other.name?.value || 'Record'}
                    </h4>
                    {other.description?.value && (
                        <p className="text-sm leading-relaxed text-grayscale-600">
                            {other.description.value}
                        </p>
                    )}
                    <ClrResultWithScaleList results={other.results} showResultType={showSource} />
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
