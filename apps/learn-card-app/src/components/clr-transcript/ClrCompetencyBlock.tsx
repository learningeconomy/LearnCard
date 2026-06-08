import React from 'react';

import { FlatIcon } from './ClrStatCard';
import { SkillsIcon } from 'learn-card-base/svgs/wallet/SkillsIcon';

import type { CompetencyDisplayModel, ResultDisplayModel } from '../../helpers/clrRenderer.helpers';

const scaleItemsForResult = (result: ResultDisplayModel): string[] => {
    if (result.valueMin?.value && result.valueMax?.value) {
        return [`${result.valueMin.value}-${result.valueMax.value}`];
    }

    if (result.valueMax?.value) {
        return [`max ${result.valueMax.value}`];
    }

    if (result.allowedValue?.value.length) {
        return result.allowedValue.value;
    }

    return [];
};

const ClrCompetencyBlock: React.FC<{
    competency: CompetencyDisplayModel;
    adminMode?: boolean;
}> = ({ competency, adminMode = false }) => {
    const renderResult = (result: ResultDisplayModel, index: number) => {
        const scaleItems = scaleItemsForResult(result);
        const label = result.label?.value ?? 'Competency Level';

        return (
            <div key={index} className="space-y-3 mt-2">
                {/* <p className="text-xs font-semibold uppercase tracking-wider text-grayscale-500">
                    {label}
                </p> */}

                <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="text-base font-semibold text-grayscale-900">
                        Level:{' '}
                        <span className="text-grayscale-700">{String(result.value.value)}</span>
                    </p>
                    {adminMode && result.resultType?.value && (
                        <span className="text-xs text-grayscale-400">
                            [{result.resultType.value}]
                        </span>
                    )}
                </div>

                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-grayscale-500">
                        Scale
                    </p>
                    {scaleItems.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {scaleItems.map(item => (
                                <span
                                    key={`${label}-${item}`}
                                    className="inline-flex items-center rounded-full border border-grayscale-200 bg-grayscale-50 px-3 py-1 text-xs font-medium text-grayscale-700"
                                >
                                    {item}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-grayscale-500">No scale provided</p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-2 border-t border-grayscale-100 first:border-t-0 first:pt-0 pt-4">
            <div className="inline-flex max-w-full items-center gap-1 rounded-full border border-grayscale-200 bg-grayscale-10 px-3 py-1 whitespace-nowrap">
                <span className="shrink-0">
                    <FlatIcon>
                        <SkillsIcon className="w-5 h-5 text-grayscale-700" />
                    </FlatIcon>
                </span>
                <span className="min-w-0 truncate text-xs font-semibold text-grayscale-900">
                    {competency.name?.value ?? 'Competency'}
                </span>
            </div>

            {competency.description?.value && (
                <p className="text-sm text-grayscale-600 leading-relaxed">
                    {competency.description.value}
                </p>
            )}

            {competency.results.length > 0 && (
                <div className="space-y-4">
                    {competency.results.map((result, index) => (
                        <div
                            key={`${competency.sourceCredentialId}-${index}`}
                            className="border-t border-grayscale-100 pt-4 first:border-t-0 first:pt-0"
                        >
                            {renderResult(result, index)}
                        </div>
                    ))}
                </div>
            )}

            {adminMode && (
                <div className="pt-2 border-t border-grayscale-100">
                    <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wide">
                        Source credential
                    </p>
                    <p className="text-xs font-mono text-grayscale-400 break-all mt-1">
                        {competency.sourceCredentialId}
                    </p>
                </div>
            )}
        </div>
    );
};

export default ClrCompetencyBlock;
