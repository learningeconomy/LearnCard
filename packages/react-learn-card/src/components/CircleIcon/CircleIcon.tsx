import React from 'react';

import { Icons } from '../../types';
import { ICONS_TO_SOURCE } from '../../constants/icons';

export type CircleIconProps = {
    iconSrc?: string;
    count?: string | number;
    onClick?: () => void;
    bgColor?: string;
    innerPadding?: string;
    size?: string;
};

export type CountCircleProps = {
    size?: string;
    count?: string | number;
    innerPadding?: string;
    onClick?: () => {};
    bgColor?: string;
};

export const CountCircle: React.FC<CountCircleProps> = ({
    size = 'auto',
    count = '28',
    innerPadding = '3px 5px',
    onClick = () => {},
    bgColor = 'bg-grayscale-50',
}) => {
    const style = {
        width: size,
        height: size,
        padding: innerPadding,
    };

    return (
        <section
            onClick={onClick}
            className={`${bgColor} rounded-full circle-icon-wrapper text-center absolute right-[-15px] top-[-15px] min-w-[25px]`}
            style={style}
        >
            <div className={`w-full h-full`}>
                <p className="line-clamp-1 font-semibold text-grayscale-900 text-[12px]">{count}</p>
            </div>
        </section>
    );
};

export const CircleIcon: React.FC<CircleIconProps> = ({
    iconSrc = ICONS_TO_SOURCE[Icons.sheckelsIcon],
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
