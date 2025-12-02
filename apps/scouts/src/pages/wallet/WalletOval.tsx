import React from 'react';

import CircleIcon from '../CircleIcon/CircleIcon';
// import { Icons, WalletCategoryTypes } from '../../types';

export type WalletOvalProps = {
    title?: string;
    description?: string;
    type?: WalletCategoryTypes;
    iconSrc?: any;
    imgSrc?: string;
    count?: string | number;
    onClick?: () => void;
    bgColor?: string;
    // iconCircleClass?: string;
    loading?: boolean;
    containerClass?: string;
};

export const WalletOval: React.FC<WalletOvalProps> = ({
    title,
    description,
    iconSrc,
    imgSrc,
    type,
    count = '28',
    onClick = () => {},
    bgColor,
    // iconCircleClass = '',
    loading,
    containerClass = '',
}) => {
    const imgSource = imgSrc;
    const backgroundColor = bgColor;
    const circleClass = `flex w-full justify-end icon-display absolute right-[15px] bottom-[10px] max-h-[40px] max-w-[40px] rounded-full`;
    const iconAltDescription = `${title} Icon`;
    return (
        <button
            data-testid={`wallet-btn-${type}`}
            onClick={onClick}
            className={`${backgroundColor} rounded-square-card-container ${containerClass}`}
        >
            <div className="w-full relative">
                <section className="flex items-center">
                    <h3 className="line-clamp-2 font-normal text-[25px] text-white font-notoSans ml-[5px]">
                        {title}
                    </h3>
                </section>
                <p className="text-white text-[14px] text-left ml-[5px] font-notoSans font-semibold">
                    {description}
                </p>
                {/* <div className="graphic-background relative flex justify-center">
                    <img alt={iconAltDescription} className="max-w-[130px]" src={imgSource} />
                </div> */}
            </div>
            <div className="absolute bottom-[10px] right-[10px] rounded-[30px] bg-white py-[10px] pl-[12px] pr-[17px] h-[50px] flex items-center justify-center">
                {iconSrc}
                <p className="ml-[6px]">{count}</p>
            </div>
            {/* <div className={`${circleClass}`}>
                <CircleIcon
                    iconCircleClass={iconCircleClass}
                    // // iconSrc={iconSrc}
                    count={count}
                    size="40"
                    loading={loading}
                />
            </div> */}
        </button>
    );
};

export default WalletOval;
