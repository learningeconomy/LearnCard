import React from 'react';
import { LearnPillProps } from '../../types';
import { TYPE_TO_MINI_ICON } from '../RoundedSquare';

const TYPE_TO_COLOR = {
    job: 'bg-emerald-50',
    achievement: 'bg-spice-50',
    skill: 'bg-indigo-50',
};

const TYPE_TO_TEXT_COLOR = {
    job: 'text-emerald-700',
    achievement: 'text-spice-500',
    skill: 'text-indigo-600',
};

export const LearnPill: React.FC<LearnPillProps> = ({ count = 0, type = 'job', className }) => {
    const imgSrc = TYPE_TO_MINI_ICON[type];
    const bgColor = TYPE_TO_COLOR[type];
    const textColor = TYPE_TO_TEXT_COLOR[type];
    return (
        <div
            className={`course-card-stat-bubble px-[10px] rounded-[30px] flex ${bgColor} min-w-[48px] max-w-[100px] h-[30px] items-center ${className}`}
        >
            <img src={imgSrc} />
            <span className={`flex items-center text-sm ${textColor} font-bold`}>{count}</span>
        </div>
    );
};

export default LearnPill;
