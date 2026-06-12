import React from 'react';
import { gradeColorBackground } from './clr.helpers';

const GRADE_ORDER = ['F', 'D-', 'D', 'D+', 'C-', 'C+', 'C', 'B-', 'B', 'B+', 'A-', 'A', 'A+'];

const ClrGradeScale: React.FC<{
    grade: string;
    allowedGrades: string[];
}> = ({ grade, allowedGrades }) => {
    const orderedGrades = GRADE_ORDER.filter(g => allowedGrades.includes(g));

    if (orderedGrades.length === 0) return null;

    return (
        <div className="space-y-2 mt-4 border-t border-grayscale-200 pt-4">
            <p className="text-xs font-semibold text-grayscale-600 uppercase tracking-wide">
                Grade Scale
            </p>
            <div className="flex items-center gap-1 flex-wrap">
                {orderedGrades.map(g => {
                    const isActive = g === grade;
                    const activeColors = gradeColorBackground(g);
                    return (
                        <span
                            key={g}
                            className={`w-9 h-9 flex items-center justify-center rounded-full text-xs font-semibold border transition-colors shrink-0 text-grayscale-800 ${
                                isActive ? activeColors : 'bg-grayscale-100 border-grayscale-200 '
                            }`}
                        >
                            {g}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

export default ClrGradeScale;
