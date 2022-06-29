import React from 'react';
import { Icons } from '../../types';
import { ICONS_TO_SOURCE } from '../../constants/icons';
import CircleIcon from '../CircleIcon/CircleIcon';

export type RoundedSquareProps = {
    title?: string;
    description?: string;
    iconSrc?: string;
    count?: string | number;
    onClick?: () => void;
    bgColor?: string;
};

export const RoundedSquare: React.FC<RoundedSquareProps> = ({
    title = 'Learning History',
    description = 'Lorem ipsum sit dalor amet',
    iconSrc = ICONS_TO_SOURCE[Icons.sheckelsIcon],
    count = '28',
    onClick = () => {},
    bgColor = 'bg-cyan-200',
}) => {
    return (
        <section
            onClick={onClick}
            className={`relative ${bgColor}  py-[15px] px-[15px] w-[170px] h-[170px] rounded-[40px] rounded-square-card-container`}
        >
            <div className="w-full py-[10px] relative">
                <h3 className="line-clamp-2 font-bold text-[17px] text-grayscale-900">{title}</h3>
                <p className="line-clamp-2 text-[10px] text-grayscale-900 text-opacity-60">
                    {description}
                </p>
            </div>

            <div className="flex w-full justify-end icon-display absolute right-[20px] bottom-[15px]">
                <CircleIcon iconSrc={iconSrc} count={count} />
            </div>
        </section>
    );
};

export default RoundedSquare;
