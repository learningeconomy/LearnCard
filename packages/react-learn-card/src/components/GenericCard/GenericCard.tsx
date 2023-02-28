import React from 'react';
import { GenericCardProps, WalletCategoryTypes } from '../../types';
import { TYPE_TO_IMG_SRC, TYPE_TO_WALLET_DARK_COLOR } from '../../constants';
import { CircleCheckButton } from '../CircleCheckButton';

export const GenericCard: React.FC<GenericCardProps> = ({
    title = 'Title Lorem Ipsum',
    thumbImgSrc,
    customThumbClass = '',
    customHeaderClass = '',
    type = WalletCategoryTypes.achievements,
    className,
    onClick = () => {},
    showChecked,
    checkStatus,
    flipped,
    subHeaderComponent,
}) => {
    const thumbClass = `bg-${TYPE_TO_WALLET_DARK_COLOR[type]}` ?? 'bg-grayscale-50';
    const defaultThumbClass = `flex h-[110px] m-auto ${thumbClass} w-[140px] overflow-hidden flex-col justify-center items-center w-full rounded-[20px] ${customThumbClass}`;
    const imgSrc = thumbImgSrc?.trim() !== '' ? thumbImgSrc : TYPE_TO_IMG_SRC[type];
    const headerBgColor = `bg-${TYPE_TO_WALLET_DARK_COLOR[type]}` ?? 'bg-grayscale-900';
    const checkBtnClass = checkStatus ? 'generic-vc-card checked' : 'generic-vc-card unchecked';
    const defaultHeaderClass = `flex generic-card-title w-full flex justify-center items-center  h-[76px] ${headerBgColor} ${customHeaderClass}`;
    const flippedClass = flipped ? 'flex-col-reverse' : 'flex-col';

    return (
        <button
            onClick={onClick}
            className={`flex generic-display-card-simple bg-white ${flippedClass} shadow-[0_0_8px_0px_rgba(0,0,0,0.2)] relative $ py-[0px] px-[0px] w-[160px] h-[215px] rounded-[20px] overflow-hidden ${className}`}
        >
            <section className={defaultHeaderClass}>
                <p className="relative z-[100] text-[14px] px-[10px] py-[0px] font-bold mt-[10px] text-center text-white line-clamp-2">
                    {title}
                </p>
            </section>
            <section className={defaultThumbClass}>
                {thumbImgSrc && thumbImgSrc?.trim() !== '' && (
                    <img
                        className="generic-display-card-img h-full w-full  w-[140px] h-[119px] rounded-[20px] object-cover overflow-hidden"
                        src={thumbImgSrc ?? ''}
                        alt="Credential Achievement Image"
                    />
                )}
                {(!thumbImgSrc || thumbImgSrc?.trim() === '') && (
                    <img
                        className="max-w-[130px] w-full h-full p-[10px] object-contain"
                        src={imgSrc}
                    />
                )}
            </section>

            <section className="generic-card-footer"></section>
            {showChecked && (
                <div className="check-btn-overlay absolute top-[5px] left-[5px]">
                    <CircleCheckButton
                        checked={checkStatus}
                        onClick={onClick}
                        className={checkBtnClass}
                    />
                </div>
            )}
        </button>
    );
};

export default GenericCard;
