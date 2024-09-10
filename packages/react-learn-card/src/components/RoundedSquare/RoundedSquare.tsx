import React from 'react';

import CircleIcon from '../CircleIcon/CircleIcon';
import { Icons, WalletCategoryTypes } from '../../types';
import { ICONS_TO_SOURCE } from '../../constants/icons';
import { TYPE_TO_IMG_SRC, TYPE_TO_WALLET_COLOR } from '../../constants';

export type RoundedSquareProps = {
    title?: string;
    description?: string;
    type?: WalletCategoryTypes;
    iconSrc?: string;
    imgSrc?: string;
    count?: string | number;
    onClick?: () => void;
    bgColor?: string;
    iconCircleClass?: string;
    loading?: boolean;
    containerClass?: string;
};

export const RoundedSquare: React.FC<RoundedSquareProps> = ({
    title = 'Currencies',
    description = 'Lorem ipsum sit dalor amet',
    iconSrc = ICONS_TO_SOURCE[Icons.trophyIcon],
    imgSrc,
    type = WalletCategoryTypes.achievements,
    count = '28',
    onClick = () => {},
    bgColor,
    iconCircleClass = '',
    loading,
    containerClass = '',
}) => {
    const imgSource = imgSrc || TYPE_TO_IMG_SRC[type];
    const backgroundColor = bgColor ?? `bg-${TYPE_TO_WALLET_COLOR[type]}`;
    const circleClass = `flex w-full justify-end icon-display absolute right-[15px] bottom-[10px] max-h-[40px] max-w-[40px] rounded-full`;
    const iconAltDescription = `${title} Icon`;
    return (
        <button
            onClick={onClick}
            className={`flex relative ${backgroundColor} py-[15px] px-[15px] w-[170px] h-[190px] rounded-[40px] rounded-square-card-container ${containerClass}`}
        >
            <div className="w-full relative">
                <section className="title-headline-container flex items-center">
                    <h3 className="line-clamp-2 font-bold text-[13px] text-grayscale-900 ml-[5px]">
                        {title}
                    </h3>
                </section>
                <p className="text-grayscale-900 text-[11px] text-left ml-[5px] font-poppins font-normal leading-[13px]">{description}</p>
                <div className="graphic-background relative flex justify-center">
                    <img alt={iconAltDescription} className="max-w-[130px]" src={imgSource} />
                </div>
            </div>

            <div className={`${circleClass}`}>
                <CircleIcon
                    iconCircleClass={iconCircleClass}
                    iconSrc={iconSrc}
                    count={count}
                    size="40"
                    loading={loading}
                />
            </div>
        </button>
    );
};

export default RoundedSquare;
