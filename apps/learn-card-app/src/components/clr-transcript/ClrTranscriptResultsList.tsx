import React from 'react';
import type { ResultDisplayModel } from '../../helpers/clrRenderer.helpers';

const ClrTranscriptResultsList: React.FC<{
    results: ResultDisplayModel[];
    showResultType?: boolean;
}> = ({ results, showResultType = false }) => {
    if (results.length === 0) return null;

    const gradeScale = (result: ResultDisplayModel): string | undefined => {
        if (result.valueMin && result.valueMax)
            return `${result.valueMin.value}–${result.valueMax.value}`;
        if (result.valueMax) return `max ${result.valueMax.value}`;
        if (result.allowedValue && result.allowedValue.value.length > 0)
            return result.allowedValue.value.join(', ');
        return undefined;
    };

    return (
        <div className="bg-white border border-grayscale-200 rounded-[20px] overflow-hidden">
            <div className="grid grid-cols-[1fr_64px_64px] px-5 py-2 bg-grayscale-50 border-b border-grayscale-100">
                <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wider">
                    Category
                </p>
                <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wider text-right">
                    Score
                </p>
                <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wider text-right">
                    Scale
                </p>
            </div>
            {results.map((result, index) => {
                const scale = gradeScale(result);
                return (
                    <div
                        key={index}
                        className={`grid grid-cols-[1fr_64px_64px] px-5 py-3.5 border-b border-grayscale-100 last:border-0 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-grayscale-50'
                        }`}
                    >
                        <p className="text-sm text-grayscale-700">
                            {result.label?.value || 'Result'}
                            {showResultType && result.resultType?.value && (
                                <span className="text-grayscale-400 ml-1">
                                    [{result.resultType.value}]
                                </span>
                            )}
                        </p>
                        <p className="text-sm font-bold text-grayscale-900 text-right">
                            {String(result.value.value)}
                        </p>
                        <p className="text-sm text-grayscale-400 text-right">{scale ?? '—'}</p>
                    </div>
                );
            })}
        </div>
    );
};

export default ClrTranscriptResultsList;
