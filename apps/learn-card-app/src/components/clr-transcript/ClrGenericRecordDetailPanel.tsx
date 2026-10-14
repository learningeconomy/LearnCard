import React, { useMemo } from 'react';
import * as m from '../../paraglide/messages.js';
import { createClrCanonicalRecordMap } from 'learn-card-base/helpers/credentials/clr/renderer';
import { X } from 'lucide-react';
import { useModal } from 'learn-card-base';
import type {
    AwardDisplayModel,
    OtherAcademicRecordModel,
    ClrTranscriptDisplayModel,
} from 'learn-card-base/helpers/credentials/clr/renderer';
import { formatAchievementType } from 'learn-card-base/helpers/credentials/clr/helpers';
import { ClrRecordDetails } from './ClrRecordDetails';
import ClrResultWithScaleList from './ClrResultWithScaleList';
import ClrAlignmentList from './ClrAlignmentList';
import ClrRelationshipChips from './ClrRelationshipChips';
import ClrTranscriptEvidenceList from './ClrTranscriptEvidenceList';

/** Source-backed details for qualifications and mixed records reached through CLR associations. */
const ClrGenericRecordDetailPanel = ({
    record,
    model,
    onSelectRecord,
    adminMode = false,
}: {
    record: AwardDisplayModel | OtherAcademicRecordModel;
    model: ClrTranscriptDisplayModel;
    onSelectRecord?: (id: string) => void;
    adminMode?: boolean;
}) => {
    const { closeModal } = useModal();
    const recordsById = useMemo(
        () => createClrCanonicalRecordMap(model.canonical),
        [model.canonical]
    );
    const canonical = recordsById.get(record.sourceCredentialId);
    return (
        <div className="h-full overflow-y-auto bg-grayscale-100 font-poppins pb-10">
            <div className="flex items-start justify-between gap-3 rounded-b-[30px] bg-white px-6 py-5">
                <div className="min-w-0">
                    <h2 className="break-words text-xl font-semibold text-grayscale-900">
                        {record.name?.value ?? m['clrTranscript.details.recordDetails']()}
                    </h2>
                    {!!canonical?.achievementTypes.length && (
                        <p className="mt-1 text-sm text-grayscale-600">
                            {canonical.achievementTypes
                                .map(type => formatAchievementType(type.value))
                                .join(' · ')}
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    aria-label={m['clrTranscript.details.closeRecordDetails']()}
                    onClick={closeModal}
                    className="shrink-0 rounded-full border border-grayscale-200 p-3 text-grayscale-600"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>
            <div className="space-y-4 px-5 py-5">
                {record.description?.value && (
                    <p className="break-words rounded-[20px] bg-white p-4 text-sm leading-relaxed text-grayscale-600">
                        {record.description.value}
                    </p>
                )}
                <div className="space-y-4 rounded-[20px] border border-grayscale-200 bg-white p-4">
                    <ClrResultWithScaleList results={record.results} showResultType={adminMode} />
                    <ClrRecordDetails record={canonical} />
                    <ClrAlignmentList alignments={record.alignments} />
                    <ClrTranscriptEvidenceList evidence={record.evidence} />
                    <ClrRelationshipChips
                        relationships={model.relationships[record.sourceCredentialId] ?? []}
                        onSelectRecord={onSelectRecord}
                    />
                </div>
            </div>
        </div>
    );
};

export default ClrGenericRecordDetailPanel;
