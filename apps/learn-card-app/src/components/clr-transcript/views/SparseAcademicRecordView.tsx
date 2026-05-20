import type { ClrTranscriptDisplayModel } from '../../../helpers/clrRenderer.helpers';
import { formatClrDate } from '../../../helpers/clrRenderer.helpers';
import ClrTranscriptResultsList from '../ClrTranscriptResultsList';

type Props = {
    model: ClrTranscriptDisplayModel;
    showSource?: boolean;
};

const SparseAcademicRecordView = ({ model, showSource = false }: Props) => {
    return (
        <div className="space-y-4">
            {model.assessments.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-grayscale-900">Assessments</p>
                    {model.assessments.map(assessment => (
                        <div
                            key={assessment.sourceCredentialId}
                            className="bg-white border border-grayscale-200 rounded-xl p-3 space-y-1"
                        >
                            <p className="text-sm text-grayscale-900">
                                {assessment.name?.value || 'Assessment'}
                            </p>
                            {assessment.description?.value && (
                                <p className="text-xs text-grayscale-600 leading-relaxed">
                                    {assessment.description.value}
                                </p>
                            )}
                            {assessment.earnedAt?.value && (
                                <p className="text-xs text-grayscale-500">
                                    Earned: {formatClrDate(assessment.earnedAt.value)}
                                </p>
                            )}
                            <ClrTranscriptResultsList
                                results={assessment.results}
                                showResultType={showSource}
                            />
                        </div>
                    ))}
                </div>
            )}
            {model.otherRecords.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-grayscale-900">Other Records</p>
                    {model.otherRecords.map(other => (
                        <div
                            key={other.sourceCredentialId}
                            className="bg-white border border-grayscale-200 rounded-xl p-3 space-y-1"
                        >
                            <p className="text-sm text-grayscale-900">
                                {other.name?.value || 'Academic record'}
                            </p>
                            {other.description?.value && (
                                <p className="text-xs text-grayscale-600 leading-relaxed">
                                    {other.description.value}
                                </p>
                            )}
                            {other.earnedAt?.value && (
                                <p className="text-xs text-grayscale-500">
                                    Earned: {formatClrDate(other.earnedAt.value)}
                                </p>
                            )}
                            <p className="text-xs text-grayscale-500">{other.reason}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SparseAcademicRecordView;
