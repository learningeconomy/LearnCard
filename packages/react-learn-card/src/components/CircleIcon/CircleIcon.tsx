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

export const CircleIcon: React.FC<CircleIconProps> = ({
    iconSrc = ICONS_TO_SOURCE[Icons.sheckelsIcon],
    size = '50px',
    count = '28',
    innerPadding = '8px',
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
            className={`${bgColor} rounded-full circle-icon-wrapper`}
            style={style}
        >
            <div className={`w-full h-full`}>
                <img
                    className="h-full w-full object-cover"
                    src={iconSrc ?? ''}
                    alt="Credential Achievement Image"
                />
            </div>
        </section>
    );
};

export default CircleIcon;
