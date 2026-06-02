import React from 'react';

import ClrTranscriptWarningsPanel from '../ClrTranscriptWarningsPanel';
import ClrTranscriptEvidenceList from '../ClrTranscriptEvidenceList';
import StructuredTranscriptView from './StructuredTranscriptView';
import SparseAcademicRecordView from './SparseAcademicRecordView';

import type { ClrTranscriptDisplayModel } from '../../../helpers/clrRenderer.helpers';

const VerifierInspectionView: React.FC<{
    model: ClrTranscriptDisplayModel;
}> = ({ model }) => {
    return (
        <div className="space-y-4">
            <ClrTranscriptWarningsPanel warnings={model.warnings} />
            {model.courses.length > 0 ? (
                <StructuredTranscriptView model={model} showSource />
            ) : (
                <SparseAcademicRecordView model={model} showSource />
            )}
            <ClrTranscriptEvidenceList evidence={model.evidence} />
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
