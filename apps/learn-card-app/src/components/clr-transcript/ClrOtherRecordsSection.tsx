import React, { useMemo } from 'react';
import * as m from '../../paraglide/messages.js';
import { createClrCanonicalRecordMap } from 'learn-card-base/helpers/credentials/clr/renderer';

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
    const recordsById = useMemo(
        () => createClrCanonicalRecordMap(model.canonical),
        [model.canonical]
    );
    if (!model.otherRecords.length) return null;

    return (
        <section aria-label={m['clrTranscript.details.otherRecords']()} className="space-y-3">
            <div className="flex items-center justify-between border-b border-grayscale-100 px-1 pb-2">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-grayscale-500">
                    {m['clrTranscript.details.otherRecords']()}
                </h3>
                <p className="text-xs text-grayscale-500">
                    {model.otherRecords.length === 1
                        ? m['clrTranscript.details.itemCountOne']({
                              count: model.otherRecords.length,
                          })
                        : m['clrTranscript.details.itemCountOther']({
                              count: model.otherRecords.length,
                          })}
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
                                {other.name?.value || m['clrTranscript.details.record']()}
                            </button>
                        ) : (
                            other.name?.value || m['clrTranscript.details.record']()
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
                    <ClrRecordDetails record={recordsById.get(other.sourceCredentialId)} />
                </div>
            ))}
        </section>
    );
};
