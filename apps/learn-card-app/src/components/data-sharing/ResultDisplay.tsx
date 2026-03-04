import React from 'react';
import type { XAPIStatement } from './XApiDataFeedModal';

type ResultDisplayProps = {
    result: NonNullable<XAPIStatement['result']>;
};

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
    const hasScore = result?.score !== undefined;
    const hasCompletion = result?.completion !== undefined;
    const hasSuccess = result?.success !== undefined;

    if (!hasScore && !hasCompletion && !hasSuccess) return null;

    return (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-grayscale-100">
            {hasScore && result?.score?.scaled !== undefined && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-lg">
                    <span className="text-xs text-blue-600 font-medium">
                        Score: {Math.round(result?.score?.scaled * 100)}%
                    </span>
                </div>
            )}

            {hasCompletion && (
                <div
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${
                        result?.completion ? 'bg-emerald-50' : 'bg-amber-50'
                    }`}
                >
                    <span
                        className={`text-xs font-medium ${
                            result?.completion ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                    >
                        {result?.completion ? 'Completed' : 'In Progress'}
                    </span>
                </div>
            )}

            {hasSuccess && (
                <div
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${
                        result?.success ? 'bg-emerald-50' : 'bg-rose-50'
                    }`}
                >
                    <span
                        className={`text-xs font-medium ${
                            result?.success ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                    >
                        {result?.success ? 'Passed' : 'Failed'}
                    </span>
                </div>
            )}
        </div>
    );
};

export default ResultDisplay;
