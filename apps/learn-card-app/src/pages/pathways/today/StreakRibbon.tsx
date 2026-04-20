/**
 * StreakRibbon — a single strip showing the current streak and whether
 * today's grace window is active.
 *
 * Docs § 5: "A streak is a promise to yourself, not a quota." The
 * ribbon is deliberately calm — no fireworks, no shaming.
 */

import React from 'react';

interface StreakRibbonProps {
    current: number;
    longest: number;
    inGraceWindow: boolean;
}

const StreakRibbon: React.FC<StreakRibbonProps> = ({ current, longest, inGraceWindow }) => {
    if (current === 0 && longest === 0) {
        return (
            <div className="py-2.5 px-4 rounded-full bg-grayscale-100 border border-grayscale-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-grayscale-300" />

                <span className="text-xs text-grayscale-600">
                    Today is day one — no streak to keep yet
                </span>
            </div>
        );
    }

    return (
        <div
            className={`py-2.5 px-4 rounded-full border flex items-center gap-2 ${
                inGraceWindow
                    ? 'bg-amber-50 border-amber-100'
                    : 'bg-emerald-50 border-emerald-100'
            }`}
        >
            <span
                className={`w-2 h-2 rounded-full ${
                    inGraceWindow ? 'bg-amber-500' : 'bg-emerald-600'
                }`}
            />

            <span
                className={`text-xs font-medium ${
                    inGraceWindow ? 'text-amber-700' : 'text-emerald-700'
                }`}
            >
                {current}-day streak
            </span>

            {longest > current && (
                <span className="text-xs text-grayscale-500">· best {longest}</span>
            )}

            {inGraceWindow && (
                <span className="text-xs text-amber-700 ml-auto">Grace window active</span>
            )}
        </div>
    );
};

export default StreakRibbon;
