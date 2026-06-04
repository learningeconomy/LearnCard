import type { ClrTranscriptDisplayModel } from '../../helpers/clrRenderer.helpers';
import { formatClrGpa } from './clr.helpers';

const ClrTranscriptSummaryStats: React.FC<{
    model: ClrTranscriptDisplayModel;
}> = ({ model }) => {
    const hasAny =
        model.summary.gpa ||
        model.summary.courseCount > 0 ||
        model.summary.totalCreditsAvailable !== undefined ||
        model.summary.explicitCompetencyCount > 0 ||
        model.summary.evidenceCount > 0;

    if (!hasAny) return null;

    const Card = ({ title, value }: { title: string; value: string | number }) => (
        <div className="bg-white border border-grayscale-200 rounded-[20px] p-4 min-w-[140px]">
            <p className="text-xs font-medium text-grayscale-700">{title}</p>
            <p className="text-xl font-semibold text-grayscale-900">{value}</p>
        </div>
    );

    return (
        <div className="flex flex-wrap gap-3">
            {model.summary.gpa && <Card title="GPA" value={formatClrGpa(model.summary.gpa.value)} />}
            {model.summary.courseCount > 0 && (
                <Card title="Courses" value={model.summary.courseCount} />
            )}
            {model.summary.totalCreditsAvailable !== undefined && (
                <Card title="Credits" value={model.summary.totalCreditsAvailable} />
            )}
            {model.summary.explicitCompetencyCount > 0 && (
                <Card title="Competencies" value={model.summary.explicitCompetencyCount} />
            )}
            {model.summary.evidenceCount > 0 && (
                <Card title="Evidence" value={model.summary.evidenceCount} />
            )}
        </div>
    );
};

export default ClrTranscriptSummaryStats;
