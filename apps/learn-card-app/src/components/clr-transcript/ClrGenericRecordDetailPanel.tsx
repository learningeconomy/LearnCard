import React, { useMemo } from 'react';
import * as m from '../../paraglide/messages.js';
import {
    createClrCanonicalRecordMap,
    createClrRecordMap,
} from 'learn-card-base/helpers/credentials/clr/renderer';
import { IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { useModal } from 'learn-card-base';
import type {
    ClrNavigableRecord,
    ClrTranscriptDisplayModel,
} from 'learn-card-base/helpers/credentials/clr/renderer';
import { formatAchievementType } from 'learn-card-base/helpers/credentials/clr/helpers';
import { ClrRecordDetails } from './ClrRecordDetails';
import ClrResultWithScaleList from './ClrResultWithScaleList';
import ClrAlignmentList from './ClrAlignmentList';
import ClrRelationshipChips from './ClrRelationshipChips';
import ClrTranscriptEvidenceList from './ClrTranscriptEvidenceList';
import { ClrCreditValues } from './ClrCreditValues';
import { ClrRecordVerification, ClrRecordVerificationDetails } from './ClrVerificationSummary';

/** Source-backed details for qualifications and mixed records reached through CLR associations. */
const ClrGenericRecordDetailPanel = ({
    record,
    model,
    onSelectRecord,
    adminMode = false,
    prominentFields = false,
}: {
    record: ClrNavigableRecord['record'];
    model: ClrTranscriptDisplayModel;
    onSelectRecord?: (id: string) => void;
    adminMode?: boolean;
    prominentFields?: boolean;
}) => {
    const { closeModal } = useModal();
    const recordsById = useMemo(
        () => createClrCanonicalRecordMap(model.canonical),
        [model.canonical]
    );
    const displayRecordsById = useMemo(() => createClrRecordMap(model), [model]);
    const canonical = recordsById.get(record.sourceCredentialId);
    const displayRecord = displayRecordsById.get(record.sourceCredentialId);
    const course = displayRecord?.kind === 'course' ? displayRecord.record : undefined;
    const verification = {
        node: model.verification.snapshot?.records[record.sourceCredentialId],
        recordId: record.sourceCredentialId,
        recordName: record.name?.value,
        publisherDid: model.canonical.collection.publisher?.id?.value,
        drawer: true,
    };
    return (
        <div className="h-full overflow-y-auto bg-white px-5 py-5 font-poppins sm:px-7">
            <div className="space-y-5">
                <header className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                        {!!canonical?.achievementTypes.length && (
                            <p className="text-sm font-medium text-grayscale-700">
                                {canonical.achievementTypes
                                    .map(type => formatAchievementType(type.value))
                                    .join(' · ')}
                            </p>
                        )}
                        <h2 className="wrap-anywhere text-xl font-semibold leading-tight text-grayscale-900">
                            {record.name?.value ?? m['clrTranscript.details.recordDetails']()}
                        </h2>
                        <ClrRecordVerification {...verification} />
                        {canonical?.humanCode && (
                            <p className="wrap-anywhere text-sm text-grayscale-700">
                                {canonical.humanCode.value}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        aria-label={m['clrTranscript.details.closeRecordDetails']()}
                        onClick={closeModal}
                        className="mt-2 flex size-11 shrink-0 items-center justify-center rounded-[20px] text-grayscale-700 hover:bg-grayscale-100 focus-visible:outline-2 focus-visible:outline-emerald-600"
                    >
                        <IonIcon aria-hidden="true" icon={closeOutline} className="size-6" />
                    </button>
                </header>
                <ClrRecordDetails
                    record={canonical}
                    prominentFields={prominentFields}
                    drawer
                    verification={
                        verification.node && <ClrRecordVerificationDetails {...verification} />
                    }
                />
                {record.description?.value && (
                    <p className="whitespace-pre-wrap wrap-anywhere text-sm leading-relaxed text-grayscale-700">
                        {record.description.value}
                    </p>
                )}
                {canonical?.term && (
                    <p className="wrap-anywhere text-sm text-grayscale-700">
                        {canonical.term.value}
                    </p>
                )}
                {course && <ClrCreditValues course={course} />}
                <ClrResultWithScaleList results={record.results} showResultType={adminMode} />
                <ClrAlignmentList alignments={record.alignments} />
                <ClrTranscriptEvidenceList evidence={record.evidence} />
                <ClrRelationshipChips
                    relationships={model.relationships[record.sourceCredentialId] ?? []}
                    onSelectRecord={onSelectRecord}
                />
            </div>
        </div>
    );
};

export default ClrGenericRecordDetailPanel;
