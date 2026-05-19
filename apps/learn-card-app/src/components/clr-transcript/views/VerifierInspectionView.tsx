import type { ClrTranscriptDisplayModel } from '../../../helpers/clrRenderer.helpers';
import ClrTranscriptWarningsPanel from '../ClrTranscriptWarningsPanel';
import StructuredTranscriptView from './StructuredTranscriptView';
import SparseAcademicRecordView from './SparseAcademicRecordView';

type Props = {
    model: ClrTranscriptDisplayModel;
};

const VerifierInspectionView = ({ model }: Props) => {
    return (
        <div className="space-y-4">
            <ClrTranscriptWarningsPanel warnings={model.warnings} />
            {model.courses.length > 0 ? (
                <StructuredTranscriptView model={model} showSource />
            ) : (
                <SparseAcademicRecordView model={model} showSource />
            )}
            <div className="bg-white border border-grayscale-200 rounded-xl p-3">
                <p className="text-xs text-grayscale-600">
                    Signed nested credentials: {model.verification.nestedCredentialSignedCount}
                </p>
                <p className="text-xs text-grayscale-600">
                    Unsigned nested credentials: {model.verification.nestedCredentialUnsignedCount}
                </p>
            </div>
        </div>
    );
};

export default VerifierInspectionView;
