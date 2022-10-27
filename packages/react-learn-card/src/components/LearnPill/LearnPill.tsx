import React from 'react';
import { LearnPillProps, LCSubtypes } from '../../types';
import { TYPE_TO_MINI_ICON } from '../../constants';

const TYPE_TO_COLOR: any = {
    [LCSubtypes.course]: 'bg-emerald-50',
    [LCSubtypes.achievement]: 'bg-spice-50',
    [LCSubtypes.skill]: 'bg-indigo-50',
};

const TYPE_TO_TEXT_COLOR: any = {
    [LCSubtypes.course]: 'text-emerald-700',
    [LCSubtypes.achievement]: 'text-spice-500',
    [LCSubtypes.skill]: 'text-indigo-600',
};

export const LearnPill: React.FC<LearnPillProps> = ({
    count = 0,
    type = LCSubtypes.course,
    className,
}) => {
    const imgSrc = TYPE_TO_MINI_ICON[type];
    const bgColor = TYPE_TO_COLOR[type];
    const textColor = TYPE_TO_TEXT_COLOR[type];
    return (
        <div
            className={`course-card-stat-bubble px-[10px] rounded-[30px] flex ${bgColor} min-w-[48px] max-w-[100px] h-[30px] items-center ${className}`}
        >
            <img src={imgSrc} className="mr-[5px]" />
            <span className={`flex items-center text-sm ${textColor} font-bold`}>{count}</span>
        </div>
    );
};

export default LearnPill;
