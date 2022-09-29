import React from 'react';
import { Icons } from '../../types';
import { ICONS_TO_SOURCE } from '../../constants/icons';
import CircleIcon from '../CircleIcon/CircleIcon';
import { CountCircle } from '../CircleIcon';

import { RoundedPillProps } from '../../types';

const TYPE_TO_COLOR_CLASS: any = {
    skill: 'bg-indigo-50',
    achievement: 'bg-spice-50',
    course: 'bg-emerald-50',
    locked: 'bg-grayscale-100',
};

export const RoundedPill: React.FC<RoundedPillProps> = ({ statusText, type, onClick }) => {
    const backgroundColor = TYPE_TO_COLOR_CLASS[type];
    const circleClass = `flex w-full justify-end icon-display absolute right-[15px] bottom-[10px] max-h-[40px] max-w-[40px]`;

    const handleClick = () => {
        onClick?.();
    }

    return (
        <button
            onClick={handleClick}
            className={`flex relative ${backgroundColor} py-[15px] px-[15px] w-[170px] h-[170px] rounded-[40px] rounded-pill-el`}
        >
            Earned
        </button>
    );
};

export default RoundedPill;
