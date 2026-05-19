import type { DisplayWarning } from '../../helpers/clrRenderer.helpers';

type Props = {
    warnings: DisplayWarning[];
};

const ClrTranscriptWarningsPanel = ({ warnings }: Props) => {
    if (warnings.length === 0) return null;

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-[20px] p-4 space-y-2">
            <p className="text-sm font-medium text-amber-800">Verifier Warnings</p>
            {warnings.map((warning, index) => (
                <p
                    key={`${warning.code}-${index}`}
                    className="text-xs text-amber-900 leading-relaxed"
                >
                    {warning.code}: {warning.message}
                </p>
            ))}
        </div>
    );
};

export default ClrTranscriptWarningsPanel;
