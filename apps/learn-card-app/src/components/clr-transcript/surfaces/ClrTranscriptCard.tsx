import React from 'react';

import ClrTranscriptHeader from '../ClrTranscriptHeader';
import ClrTranscriptEvidenceList from '../ClrTranscriptEvidenceList';
import ClrTranscriptDetailModal from '../ClrTranscriptDetailModal';

import { ModalTypes, useModal } from 'learn-card-base';

import { ClrTranscriptSurface } from '../../../helpers/clrRenderer.helpers';
import type { ClrTranscriptDisplayModel } from '../../../helpers/clrRenderer.helpers';

import { VC } from '@learncard/types';

const ClrTranscriptCard: React.FC<{
    model: ClrTranscriptDisplayModel;
    boost: VC;
    onViewDetails?: () => void;
}> = ({ model, boost, onViewDetails }) => {
    const { newModal } = useModal({ desktop: ModalTypes.Right, mobile: ModalTypes.Right });

    const handleViewDetails = () => {
        newModal(
            <ClrTranscriptDetailModal
                model={model}
                boost={boost}
                options={{ viewer: 'student', surface: ClrTranscriptSurface.Full }}
            />
        );
        // onViewDetails?.();
    };

    return (
        <div className="space-y-3 overflow-y-auto">
            <ClrTranscriptHeader model={model} />
            <ClrTranscriptEvidenceList evidence={model.evidence} compact />
            <button
                className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                onClick={handleViewDetails}
            >
                View details
            </button>
        </div>
    );
};

export default ClrTranscriptCard;
