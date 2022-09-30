import React from 'react';
import { TYPE_TO_ICON } from '../../constants/icons';
import { RoundedPillProps } from '../../types';

const TYPE_TO_BG_COLOR_CLASS: any = {
    skill: 'indigo-50',
    achievement: 'spice-50',
    course: 'emerald-50',
    locked: 'grayscale-100',
};

const TYPE_TO_FOREGROUND_COLOR: any = {
    skill: 'indigo-500',
    achievement: 'spice-500',
    course: 'emerald-700',
    locked: 'grayscale-700',
};

const TYPE_TO_CHECKMARK_COLOR: any = {
    skill: '#6366F1',
    achievement: '#FF5820',
    course: '#00BA88',
    locked: '#52597A',
};

type InlineSVGProps = {
    color?: string;
    size?: string | number;
};

export const CheckmarkSvg: React.FC<InlineSVGProps> = ({ color = '#00BA88', size = '20' }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M16.875 5.62537L8.125 14.375L3.75 10.0004"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

const LockedIcon: React.FC<InlineSVGProps> = ({ color = '#52597A', size = '20' }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M16.25 6.875H3.75C3.40482 6.875 3.125 7.15482 3.125 7.5V16.25C3.125 16.5952 3.40482 16.875 3.75 16.875H16.25C16.5952 16.875 16.875 16.5952 16.875 16.25V7.5C16.875 7.15482 16.5952 6.875 16.25 6.875Z"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M7.1875 6.875V4.0625C7.1875 3.31658 7.48382 2.60121 8.01126 2.07376C8.53871 1.54632 9.25408 1.25 10 1.25C10.7459 1.25 11.4613 1.54632 11.9887 2.07376C12.5162 2.60121 12.8125 3.31658 12.8125 4.0625V6.875"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M10 13.125C10.6904 13.125 11.25 12.5654 11.25 11.875C11.25 11.1846 10.6904 10.625 10 10.625C9.30964 10.625 8.75 11.1846 8.75 11.875C8.75 12.5654 9.30964 13.125 10 13.125Z"
                fill={color}
            />
        </svg>
    );
};

export const RoundedPill: React.FC<RoundedPillProps> = ({
    statusText,
    type = 'skill',
    onClick,
    showCheckmark = false,
}) => {
    const backgroundColor = `bg-${TYPE_TO_BG_COLOR_CLASS[type]}`;
    const iconBgColor = `bg-${TYPE_TO_FOREGROUND_COLOR[type]}`;
    const circleClass = `flex w-full items-center justify-center icon-display h-[40px] w-[40px] rounded-full ${iconBgColor}  absolute flex-shrink-0 `;

    const handleClick = () => {
        onClick?.();
    };

    const iconSrc = TYPE_TO_ICON[type];
    const textColor = `text-${TYPE_TO_FOREGROUND_COLOR[type]}`;
    const checkColor = TYPE_TO_CHECKMARK_COLOR[type];
    const locked = type === 'locked';

    const displayText = !locked ? statusText : 'Locked';

    return (
        <button
            onClick={handleClick}
            className={`flex relative ${backgroundColor} items-center px-[5px] py-[2px]  w-[180px] h-[46px] rounded-[40px] rounded-pill-el`}
        >
            {!locked && (
                <div className={circleClass}>
                    <img
                        className="h-full w-full object-cover max-h-[24px] max-w-[24px] flex-shrink-0 "
                        src={iconSrc ?? ''}
                        alt="Icon image"
                    />
                </div>
            )}
            <span
                className={`font-semibold ${textColor} w-full flex items-center justify-center text-[14px]`}
            >
                {showCheckmark && !locked && (
                    <span className="rounded-pill-checkmark mr-[5px]">
                        <CheckmarkSvg color={checkColor} />
                    </span>
                )}
                {locked && (
                    <span className="rounded-pill-checkmark mr-[5px]">
                        <LockedIcon />
                    </span>
                )}

                {displayText}
            </span>
        </button>
    );
};

export default RoundedPill;
