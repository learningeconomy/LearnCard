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

const TYPE_TO_ICON_BG_COLOR: any = {
    skill: 'bg-indigo-500',
    achievement: 'bg-spice-500',
    course: 'bg-emerald-700',
    locked: 'bg-grayscale-100',
};

export const RoundedPill: React.FC<RoundedPillProps> = ({
    statusText,
    type = 'skill',
    onClick,
}) => {
    const backgroundColor = TYPE_TO_COLOR_CLASS[type];
    const iconBgColor = TYPE_TO_ICON_BG_COLOR[type];
    const circleClass = `flex w-full items-center justify-center icon-display h-[40px] w-[40px] rounded-full ${iconBgColor}  absolute flex-shrink-0 `;

    const handleClick = () => {
        onClick?.();
    };

    const iconSrc = ICONS_TO_SOURCE[Icons.trophylight];

    return (
        <button
            onClick={handleClick}
            className={`flex relative ${backgroundColor} items-center px-[5px] py-[2px]  w-[180px] h-[46px] rounded-[40px] rounded-pill-el`}
        >
            <div className={circleClass}>
                <img
                    className="h-full w-full object-cover max-h-[24px] max-w-[24px] flex-shrink-0 "
                    src={iconSrc ?? ''}
                    alt="Icon image"
                />
            </div>
            <span className="font-semibold w-full flex items-center justify-center text-indigo-500 text-[14px]">
                {statusText}
            </span>
        </button>
    );
};

export default RoundedPill;
