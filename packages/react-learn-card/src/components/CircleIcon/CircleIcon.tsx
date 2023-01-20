import React from 'react';
import numeral from 'numeral';

import { Icons } from '../../types';
import { ICONS_TO_SOURCE } from '../../constants/icons';

export type CircleIconProps = {
    iconSrc?: string;
    count?: string | number;
    onClick?: () => void;
    bgColor?: string;
    innerPadding?: string;
    size?: string;
    borderColor?: string;
};

export type CountCircleProps = {
    size?: string;
    count?: string | number;
    innerPadding?: string;
    onClick?: () => {};
    bgColor?: string;
    className?: string;
};

export const CountCircle: React.FC<CountCircleProps> = ({
    size = 'auto',
    count = '28',
    innerPadding = '3px 5px',
    className,
    onClick = () => {},
    bgColor = 'bg-grayscale-50',
}) => {
    const _count = count >= 1000 ? numeral(count).format('0.0a') : count;

    const style = {
        width: size,
        height: size,
        padding: innerPadding,
    };

    return (
        <section
            onClick={onClick}
            className={`${bgColor} rounded-full circle-icon-wrapper text-center absolute right-[-18px] top-[-18px] min-w-[25px] ${className}`}
            style={style}
        >
            <div className={`h-full`}>
                <p className="h-full line-clamp-1 font-semibold text-grayscale-900 text-[12px]">
                    {_count}
                </p>
            </div>
        </section>
    );
};

export const CircleIcon: React.FC<CircleIconProps> = ({
    iconSrc = ICONS_TO_SOURCE[Icons.coinsIcon],
    size = '52px',
    count = '28',
    innerPadding = '6px',
    onClick = () => {},
    bgColor = 'bg-grayscale-900',
}) => {
    const style = {
        width: size,
        height: size,
        padding: innerPadding,
    };

    return (
        <section
            onClick={onClick}
            className={`${bgColor} rounded-full circle-icon-wrapper p-[0px] m-[0px]`}
            style={style}
        >
            <div className={`relative w-full h-full`}>
                <CountCircle count={count} />
                <img className="h-full w-full object-cover" src={iconSrc ?? ''} alt="Icon image" />
            </div>
        </section>
    );
};

export default CircleIcon;
