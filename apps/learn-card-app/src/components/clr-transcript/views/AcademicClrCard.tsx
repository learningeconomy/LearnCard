import React from 'react';

import ClrTranscriptHeader from '../ClrTranscriptHeader';
import ClrTranscriptEvidenceList from '../ClrTranscriptEvidenceList';
import type { ClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';

import * as m from '../../../paraglide/messages.js';

const AcademicClrCard: React.FC<{
    model: ClrTranscriptDisplayModel;
    onViewDetails: () => void;
}> = ({ model, onViewDetails }) => {
    return (
        <div className="space-y-3 overflow-y-auto">
            <ClrTranscriptHeader model={model} />
            <ClrTranscriptEvidenceList evidence={model.evidence} compact />
            <button
                className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                onClick={onViewDetails}
            >
                {m['clrRenderer.viewDetails']()}
            </button>
        </div>
    );
};

export default AcademicClrCard;
