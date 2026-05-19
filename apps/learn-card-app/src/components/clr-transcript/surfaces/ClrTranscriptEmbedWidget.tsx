import type { ClrTranscriptDisplayModel } from '../../../helpers/clrRenderer.helpers';
import ClrTranscriptHeader from '../ClrTranscriptHeader';
import ClrTranscriptSummaryStats from '../ClrTranscriptSummaryStats';
import ClrTranscriptEvidenceList from '../ClrTranscriptEvidenceList';

type Props = {
    model: ClrTranscriptDisplayModel;
};

const ClrTranscriptEmbedWidget = ({ model }: Props) => {
    return (
        <div className="space-y-3">
            <ClrTranscriptHeader model={model} />
            <ClrTranscriptSummaryStats model={model} />
            <ClrTranscriptEvidenceList evidence={model.evidence} compact />
        </div>
    );
};

export default ClrTranscriptEmbedWidget;
