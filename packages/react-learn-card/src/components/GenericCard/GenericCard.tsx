import React from 'react';
import { GenericCardProps, WalletCategoryTypes } from '../../types';
import { TYPE_TO_IMG_SRC, TYPE_TO_WALLET_DARK_COLOR } from '../../constants';

export const GenericCard: React.FC<GenericCardProps> = ({
    title = 'Title Lorem Ipsum',
    thumbImgSrc,
    customThumbClass = '',
    customHeaderClass = '',
    type = WalletCategoryTypes.achievements,
    className,
    onClick = () => {},
}) => {
    const thumbClass = `bg-${TYPE_TO_WALLET_DARK_COLOR[type]}` ?? 'bg-grayscale-50';
    const defaultThumbClass = `flex h-[110px] m-auto ${thumbClass} w-[140px] overflow-hidden p-[15px] flex-col justify-center items-center w-full rounded-[20px] ${customThumbClass}`;
    const imgSrc = thumbImgSrc ?? TYPE_TO_IMG_SRC[type];

    const headerBgColor = `bg-${TYPE_TO_WALLET_DARK_COLOR[type]}` ?? 'bg-grayscale-900';
    const defaultHeaderClass = `flex generic-card-title w-full flex justify-center items-center  h-[76px] ${headerBgColor} ${customHeaderClass}`;
    return (
        <button
            onClick={onClick}
            className={`flex generic-display-card-simple bg-white flex-col shadow-[0_0_8px_0px_rgba(0,0,0,0.2)] relative $ py-[0px] px-[0px] w-[160px] h-[215px] rounded-[20px] overflow-hidden ${className}`}
        >
            <section className={defaultHeaderClass}>
                <p className="relative z-[100] text-[14px] px-[10px] py-[0px] font-bold mt-[10px] text-center text-white line-clamp-2">
                    {title}
                </p>
            </section>
            <section className={defaultThumbClass}>
                {thumbImgSrc && (
                    <img
                        className="generic-display-card-img h-full w-full  w-[140px] h-[119px] rounded-[20px] object-contain overflow-hidden"
                        src={thumbImgSrc ?? ''}
                        alt="Credential Achievement Image"
                    />
                )}
                {(!thumbImgSrc || thumbImgSrc === '') && (
                    <img className="max-w-[130px p-[10px]" src={imgSrc} />
                )}
            </section>

            <section className="generic-card-footer"></section>
        </button>
    );
};

export default GenericCard;
