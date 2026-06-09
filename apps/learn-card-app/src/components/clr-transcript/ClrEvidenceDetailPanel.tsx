import React from 'react';

import ClrTranscriptEvidenceList, {
    type ClrEvidenceSourceSummary,
} from './ClrTranscriptEvidenceList';
import PaperClip from '../svgs/PaperClip';
import X from '../svgs/X';

import { useModal } from 'learn-card-base';

import type { EvidenceDisplayModel } from '../../helpers/clrRenderer.helpers';

const ClrEvidenceDetailPanel: React.FC<{
    evidence: EvidenceDisplayModel[];
    sourceSummaries?: Record<string, ClrEvidenceSourceSummary>;
}> = ({ evidence, sourceSummaries }) => {
    const { closeModal } = useModal();
    const evidenceCount = evidence.length;

    return (
        <div className="space-y-5 pb-10 h-full bg-grayscale-100">
            {/* Header */}
            <div className="bg-white rounded-b-[30px] overflow-hidden shadow-md px-6 py-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className="text-base leading-none text-grayscale-600">
                            <PaperClip className="w-6 h-6" />
                        </span>
                        <p className="text-[22px] text-grayscale-900 leading-tight font-semibold">
                            Evidence
                        </p>
                    </div>
                    <button
                        onClick={closeModal}
                        className="shrink-0 w-[50px] h-[50px] flex items-center justify-center rounded-full text-grayscale-600 bg-white border-solid border-grayscale-100 border-[2px]"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="px-5">
                <ClrTranscriptEvidenceList evidence={evidence} sourceSummaries={sourceSummaries} />
            </div>
        </div>
    );
};

export default ClrEvidenceDetailPanel;
