import React, { useState } from 'react';

import { FlatIcon } from 'learn-card-base/components/FlatIcon';
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

const selectedScaleIndex = (
    scaleItems: string[],
    value: ResultDisplayModel['value']['value']
): number => {
    const normalizedValue = String(value).trim().toLowerCase();

    return scaleItems.findIndex(item => item.trim().toLowerCase() === normalizedValue);
};

const SCALE_LEVEL_COLORS = [
    {
        fillClass: 'bg-emerald-600',
        textClass: 'text-emerald-600',
    },
    {
        fillClass: 'bg-sky-600',
        textClass: 'text-sky-600',
    },
    {
        fillClass: 'bg-violet-600',
        textClass: 'text-violet-600',
    },
] as const;

const colorForScaleIndex = (scaleItems: string[], activeScaleIndex: number) => {
    const rankFromHighest =
        activeScaleIndex >= 0 ? Math.max(scaleItems.length - 1 - activeScaleIndex, 0) : 0;

    return SCALE_LEVEL_COLORS[Math.min(rankFromHighest, SCALE_LEVEL_COLORS.length - 1)];
};

const ClrCompetencyBlock: React.FC<{
    competency: CompetencyDisplayModel;
    adminMode?: boolean;
}> = ({ competency, adminMode = false }) => {
    const [openScaleIndexes, setOpenScaleIndexes] = useState<Set<number>>(new Set());

    const renderResult = (result: ResultDisplayModel, index: number) => {
        const scaleItems = scaleItemsForResult(result);
        const label = result.label?.value ?? 'Competency Level';
        const activeScaleIndex = selectedScaleIndex(scaleItems, result.value.value);
        const filledScaleIndex = activeScaleIndex >= 0 ? activeScaleIndex : scaleItems.length - 1;
        const scaleColor = colorForScaleIndex(scaleItems, activeScaleIndex);
        const scaleOpen = openScaleIndexes.has(index);
        const toggleScale = () => {
            setOpenScaleIndexes(current => {
                const next = new Set(current);

                if (next.has(index)) {
                    next.delete(index);
                } else {
                    next.add(index);
                }

                return next;
            });
        };

        return (
            <div key={index} className="space-y-3 mt-2">
                <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 text-base font-semibold text-grayscale-900">
                        Level:{' '}
                        <span className={scaleColor.textClass}>{String(result.value.value)}</span>
                    </p>
                    {scaleItems.length > 0 && (
                        <button
                            type="button"
                            onClick={toggleScale}
                            className="shrink-0 text-sm font-semibold text-grayscale-500 hover:text-grayscale-800 transition-colors"
                        >
                            {scaleOpen ? 'Hide Scale' : 'View Scale'}
                        </button>
                    )}
                </div>

                {adminMode && result.resultType?.value && (
                    <span className="text-xs text-grayscale-400">[{result.resultType.value}]</span>
                )}

                {scaleItems.length > 0 ? (
                    <div className="space-y-2">
                        <div
                            className="grid h-2 gap-1 overflow-hidden rounded-full"
                            style={{
                                gridTemplateColumns: `repeat(${scaleItems.length}, minmax(0, 1fr))`,
                            }}
                            aria-label={`${label} scale`}
                        >
                            {scaleItems.map((item, itemIndex) => (
                                <div
                                    key={`${label}-${item}`}
                                    className={
                                        itemIndex <= filledScaleIndex
                                            ? scaleColor.fillClass
                                            : 'bg-grayscale-100'
                                    }
                                    aria-label={item}
                                />
                            ))}
                        </div>

                        {scaleOpen && (
                            <div
                                className="grid gap-1 text-center"
                                style={{
                                    gridTemplateColumns: `repeat(${scaleItems.length}, minmax(0, 1fr))`,
                                }}
                            >
                                {scaleItems.map((item, itemIndex) => (
                                    <span
                                        key={`${label}-${item}`}
                                        className={`min-w-0 px-1 text-xs font-semibold leading-tight ${
                                            itemIndex === activeScaleIndex
                                                ? scaleColor.textClass
                                                : 'text-grayscale-500'
                                        }`}
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-grayscale-500">
                            Scale
                        </p>
                        <p className="text-sm text-grayscale-500">No scale provided</p>
                    </div>
                )}
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
