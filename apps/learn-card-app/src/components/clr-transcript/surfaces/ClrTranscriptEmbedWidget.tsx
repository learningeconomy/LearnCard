import React from 'react';

import ClrTranscriptHeader from '../ClrTranscriptHeader';
import ClrTranscriptSummaryStats from '../ClrTranscriptSummaryStats';
import ClrTranscriptEvidenceList from '../ClrTranscriptEvidenceList';

import type { ClrTranscriptDisplayModel } from '../../../helpers/clrRenderer.helpers';

const ClrTranscriptEmbedWidget: React.FC<{
    model: ClrTranscriptDisplayModel;
}> = ({ model }) => {
    return (
        <div className="space-y-3">
            <ClrTranscriptHeader model={model} />
            <ClrTranscriptSummaryStats model={model} />
            <ClrTranscriptEvidenceList evidence={model.evidence} compact />
        </div>
    );
};

export default ClrTranscriptEmbedWidget;
