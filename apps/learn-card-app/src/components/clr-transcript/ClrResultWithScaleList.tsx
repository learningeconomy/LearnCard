import React from 'react';

import ClrSourceInfo from './ClrSourceInfo';

import type {
    AlignmentDisplayModel,
    ResultDisplayModel,
    RubricLevelDisplayModel,
} from '../../helpers/clrRenderer.helpers';

const ResultAlignment: React.FC<{ alignment: AlignmentDisplayModel }> = ({ alignment }) => {
    const name = alignment.targetName?.value ?? alignment.targetCode?.value;
    if (!name) return null;

    const framework = alignment.targetFramework?.value;
    const content = (
        <>
            Aligns to {name}
            {framework ? ` (${framework})` : ''}
        </>
    );

    return alignment.targetUrl?.value ? (
        <a
            href={alignment.targetUrl.value}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-grayscale-700 underline-offset-2 hover:text-grayscale-900 hover:underline"
        >
            {content}
        </a>
    ) : (
        <p className="text-xs text-grayscale-500">{content}</p>
    );
};

const RubricScale: React.FC<{
    levels: RubricLevelDisplayModel[];
    achieved?: RubricLevelDisplayModel;
    required?: RubricLevelDisplayModel;
}> = ({ levels, achieved, required }) => (
    <div className="space-y-1.5" role="list" aria-label="Rubric scale">
        {levels.map(level => {
            const isAchieved =
                (level.id !== undefined && level.id === achieved?.id) ||
                level.name === achieved?.name;
            const isRequired =
                (level.id !== undefined && level.id === required?.id) ||
                level.name === required?.name;

            return (
                <div
                    key={level.id ?? level.name}
                    role="listitem"
                    className={`rounded-xl border px-3 py-2 ${
                        isAchieved
                            ? 'border-grayscale-900 bg-grayscale-900 text-white'
                            : 'border-grayscale-200 bg-grayscale-50 text-grayscale-700'
                    }`}
                >
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium">{level.name}</span>
                        {isRequired && (
                            <span
                                className={`text-[10px] font-medium ${
                                    isAchieved ? 'text-white' : 'text-grayscale-500'
                                }`}
                            >
                                passing
                            </span>
                        )}
                    </div>
                    {isAchieved && level.description && (
                        <p className="mt-1 text-xs leading-relaxed text-grayscale-100">
                            {level.description}
                        </p>
                    )}
                </div>
            );
        })}
    </div>
);

const OrdinalScale: React.FC<{
    values: string[];
    achieved: string;
    required?: string;
}> = ({ values, achieved, required }) => (
    <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}
        role="img"
        aria-label={`Scale: ${values.join(', ')}; achieved ${achieved}${
            required ? `; passing ${required}` : ''
        }`}
    >
        {values.map(value => {
            const isAchieved = value === achieved;
            const isRequired = value === required;

            return (
                <div key={value} className="min-w-0 text-center">
                    <div
                        className={`h-2 rounded-full ${
                            isAchieved ? 'bg-grayscale-900' : 'bg-grayscale-100'
                        }`}
                    />
                    <p
                        className={`mt-1 truncate text-[10px] ${
                            isAchieved ? 'font-semibold text-grayscale-900' : 'text-grayscale-500'
                        }`}
                    >
                        {value}
                    </p>
                    {isRequired && (
                        <p className="text-[9px] font-medium text-grayscale-500">passing</p>
                    )}
                </div>
            );
        })}
    </div>
);

const NumericScale: React.FC<{
    min: string;
    max: string;
    value: string | number | boolean;
    required?: string;
}> = ({ min, max, value, required }) => {
    const numericMin = Number(min);
    const numericMax = Number(max);
    const numericValue = Number(value);
    const numericRequired = required === undefined ? undefined : Number(required);

    if (
        !Number.isFinite(numericMin) ||
        !Number.isFinite(numericMax) ||
        !Number.isFinite(numericValue) ||
        numericMax <= numericMin
    ) {
        return null;
    }

    const position = Math.min(
        100,
        Math.max(0, ((numericValue - numericMin) / (numericMax - numericMin)) * 100)
    );
    const requiredPosition =
        numericRequired !== undefined && Number.isFinite(numericRequired)
            ? Math.min(
                  100,
                  Math.max(0, ((numericRequired - numericMin) / (numericMax - numericMin)) * 100)
              )
            : undefined;

    return (
        <div
            role="img"
            aria-label={`Numeric scale from ${min} to ${max}; achieved ${String(value)}${
                required ? `; passing ${required}` : ''
            }`}
        >
            <div className="relative h-5">
                <div className="absolute inset-x-0 top-2 h-1 rounded-full bg-grayscale-100" />
                <div
                    className="absolute top-0 h-5 w-0.5 bg-grayscale-900"
                    style={{ left: `${position}%` }}
                />
                {requiredPosition !== undefined && (
                    <div
                        className="absolute top-1 h-3 border-l border-dashed border-grayscale-500"
                        style={{ left: `${requiredPosition}%` }}
                        title={`Passing: ${required}`}
                    />
                )}
            </div>
            <div className="flex justify-between text-[10px] text-grayscale-500">
                <span>{min}</span>
                {required !== undefined && <span>passing {required}</span>}
                <span>{max}</span>
            </div>
        </div>
    );
};

const ResultScale: React.FC<{ result: ResultDisplayModel }> = ({ result }) => {
    const value = String(result.value.value);
    const isStatus =
        result.resultType?.value === 'Status' || result.value.sourcePath.endsWith('.status');

    if (isStatus) {
        return (
            <span className="inline-flex rounded-full border border-grayscale-300 bg-grayscale-100 px-3 py-1 text-xs font-medium text-grayscale-700">
                {value}
            </span>
        );
    }

    if (result.rubricLevels?.length) {
        return (
            <RubricScale
                levels={result.rubricLevels}
                achieved={result.achievedLevel}
                required={result.requiredRubricLevel}
            />
        );
    }

    if (result.allowedValue?.value.length) {
        return (
            <OrdinalScale
                values={result.allowedValue.value}
                achieved={value}
                required={result.requiredValue?.value}
            />
        );
    }

    if (result.valueMin && result.valueMax) {
        return (
            <NumericScale
                min={result.valueMin.value}
                max={result.valueMax.value}
                value={result.value.value}
                required={result.requiredValue?.value}
            />
        );
    }

    if (result.valueMin || result.valueMax) {
        return (
            <p className="text-xs text-grayscale-500">
                Scale:{' '}
                {result.valueMin && result.valueMax
                    ? `${result.valueMin.value}–${result.valueMax.value}`
                    : result.valueMax
                      ? `maximum ${result.valueMax.value}`
                      : `minimum ${result.valueMin?.value}`}
            </p>
        );
    }

    return !result.resultDescriptionResolved ? (
        <p className="text-xs text-grayscale-400">unlinked result</p>
    ) : null;
};

const ClrResultWithScaleList: React.FC<{
    results: ResultDisplayModel[];
    showResultType?: boolean;
    compact?: boolean;
}> = ({ results, showResultType = false, compact = false }) => {
    if (results.length === 0) return null;

    return (
        <div className="space-y-2">
            {results.map((result, index) => (
                <div
                    key={result.resultDescriptionId?.value ?? index}
                    className={`rounded-2xl border border-grayscale-200 bg-white ${
                        compact ? 'p-3' : 'p-4'
                    }`}
                >
                    <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-grayscale-700">
                                {result.label?.value ?? 'Result'}
                                {showResultType && result.resultType?.value && (
                                    <span className="ml-1 text-grayscale-400">
                                        [{result.resultType.value}]
                                    </span>
                                )}
                            </p>
                            {!(
                                result.resultType?.value === 'Status' ||
                                result.value.sourcePath.endsWith('.status')
                            ) && (
                                <p className="mt-0.5 text-lg font-semibold text-grayscale-900">
                                    {String(result.value.value)}
                                </p>
                            )}
                        </div>
                        <ClrSourceInfo
                            field={result.resultDescriptionId ?? result.value}
                            label={result.label?.value ?? 'result scale'}
                        />
                    </div>

                    <ResultScale result={result} />

                    {result.alignments.length > 0 && (
                        <div className="mt-3 space-y-1">
                            {result.alignments.map((alignment, alignmentIndex) => (
                                <ResultAlignment
                                    key={`${alignment.targetUrl?.value ?? alignment.targetName?.value ?? 'alignment'}-${alignmentIndex}`}
                                    alignment={alignment}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ClrResultWithScaleList;
