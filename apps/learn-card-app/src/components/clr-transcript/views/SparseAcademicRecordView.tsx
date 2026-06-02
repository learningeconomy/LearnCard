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
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1 border-b border-grayscale-100 pb-2">
                        <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-widest">
                            Assessments
                        </p>
                        <p className="text-xs text-grayscale-500">
                            {model.assessments.length} item
                            {model.assessments.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {model.assessments.map(assessment => (
                        <div
                            key={assessment.sourceCredentialId}
                            className="bg-white border border-grayscale-200 rounded-[20px] overflow-hidden"
                        >
                            <div className="flex items-center justify-between gap-3 px-5 py-2 bg-grayscale-50 border-b border-grayscale-100">
                                <p className="text-[15px] font-semibold text-grayscale-900 truncate">
                                    {assessment.name?.value || 'Assessment'}
                                </p>
                                {assessment.earnedAt?.value && (
                                    <p className="text-xs text-grayscale-500 shrink-0">
                                        {formatClrDate(assessment.earnedAt.value)}
                                    </p>
                                )}
                            </div>

                            <div className="px-5 py-4 space-y-3">
                                {assessment.description?.value && (
                                    <p className="text-sm text-grayscale-600 leading-relaxed">
                                        {assessment.description.value}
                                    </p>
                                )}
                                <ClrTranscriptResultsList
                                    results={assessment.results}
                                    showResultType={showSource}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {model.otherRecords.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1 border-b border-grayscale-100 pb-2">
                        <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-widest">
                            Other Records
                        </p>
                        <p className="text-xs text-grayscale-500">
                            {model.otherRecords.length} item
                            {model.otherRecords.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {model.otherRecords.map(other => (
                        <div
                            key={other.sourceCredentialId}
                            className="bg-white border border-grayscale-200 rounded-[20px] overflow-hidden"
                        >
                            <div className="flex items-center justify-between gap-3 px-5 py-2 bg-grayscale-50 border-b border-grayscale-100">
                                <p className="text-[15px] font-semibold text-grayscale-900 truncate">
                                    {other.name?.value || 'Academic record'}
                                </p>
                                {other.earnedAt?.value && (
                                    <p className="text-xs text-grayscale-500 shrink-0">
                                        {formatClrDate(other.earnedAt.value)}
                                    </p>
                                )}
                            </div>

                            <div className="px-5 py-4 space-y-1.5">
                                {other.description?.value && (
                                    <p className="text-sm text-grayscale-600 leading-relaxed">
                                        {other.description.value}
                                    </p>
                                )}
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wide">
                                        Source type
                                    </p>
                                    <p className="text-xs text-grayscale-600">{other.reason}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SparseAcademicRecordView;
