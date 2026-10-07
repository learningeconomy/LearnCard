import React from 'react';

import type { RubricLevelDisplayModel } from '../../helpers/clrRenderer.helpers';

const isAchieved = (level: RubricLevelDisplayModel, achieved?: RubricLevelDisplayModel) =>
    achieved !== undefined &&
    ((level.id !== undefined && level.id === achieved.id) || level.name === achieved.name);

const achievedIndex = (levels: RubricLevelDisplayModel[], achieved?: RubricLevelDisplayModel) =>
    levels.findIndex(level => isAchieved(level, achieved));

/** Compact progress segments: one per rubric level, filled up to the achieved level. */
export const ClrRubricProgress: React.FC<{
    levels: RubricLevelDisplayModel[];
    achieved?: RubricLevelDisplayModel;
    className?: string;
}> = ({ levels, achieved, className = '' }) => {
    const reached = achievedIndex(levels, achieved);

    return (
        <div
            className={`flex items-center gap-1 ${className}`}
            role="img"
            aria-label={
                reached >= 0
                    ? `Level ${reached + 1} of ${levels.length}: ${levels[reached].name}`
                    : `${levels.length} levels, none achieved`
            }
        >
            {levels.map((level, index) => (
                <span
                    key={level.id ?? level.name}
                    className={`h-1.5 w-5 rounded-full ${
                        index <= reached ? 'bg-emerald-500' : 'bg-grayscale-200'
                    }`}
                />
            ))}
        </div>
    );
};

/** Full rubric legend: every level as a pill, the achieved level highlighted, in order. */
const ClrRubricScale: React.FC<{
    levels: RubricLevelDisplayModel[];
    achieved?: RubricLevelDisplayModel;
    title?: string;
}> = ({ levels, achieved, title = 'Proficiency Scale' }) => {
    if (levels.length === 0) return null;

    return (
        <div className="space-y-2">
            <p className="text-xs font-semibold text-grayscale-600 uppercase tracking-wide">
                {title}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
                {levels.map((level, index) => {
                    const active = isAchieved(level, achieved);

                    return (
                        <span
                            key={level.id ?? level.name}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                active
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                                    : 'bg-grayscale-100 border-grayscale-200 text-grayscale-700'
                            }`}
                        >
                            <span
                                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                                    active
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-grayscale-300 text-white'
                                }`}
                            >
                                {level.points ?? index + 1}
                            </span>
                            {level.name}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

export default ClrRubricScale;
