import { ModalTypes, useModal } from 'learn-card-base';
import { VC } from '@learncard/types';

import type { ClrTranscriptDisplayModel } from '../../../helpers/clrRenderer.helpers';
import { ClrTranscriptSurface } from '../../../helpers/clrRenderer.helpers';

import ClrTranscriptHeader from '../ClrTranscriptHeader';
import ClrTranscriptEvidenceList from '../ClrTranscriptEvidenceList';
import ClrTranscriptDetailModal from '../ClrTranscriptDetailModal';

type Props = {
    model: ClrTranscriptDisplayModel;
    credential: VC;
    onViewDetails?: () => void;
};

const ClrTranscriptCard = ({ model, credential, onViewDetails }: Props) => {
    const { newModal } = useModal({ desktop: ModalTypes.Right, mobile: ModalTypes.Right });

    const handleViewDetails = () => {
        newModal(
            <ClrTranscriptDetailModal
                model={model}
                credential={credential}
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
