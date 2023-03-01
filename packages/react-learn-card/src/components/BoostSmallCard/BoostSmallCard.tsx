import React from 'react';
import { BoostSmallCardProps, WalletCategoryTypes } from '../../types';
import { TYPE_TO_IMG_SRC, TYPE_TO_WALLET_DARK_COLOR } from '../../constants';
import { CircleCheckButton } from '../CircleCheckButton';

export const BoostSmallCard: React.FC<BoostSmallCardProps> = ({
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
    const defaultThumbClass = `flex h-[110px] my-[10px] mx-auto ${thumbClass} w-[110px] overflow-hidden flex-col justify-center items-center w-full rounded-full ${customThumbClass}`;
    const imgSrc = thumbImgSrc?.trim() !== '' ? thumbImgSrc : TYPE_TO_IMG_SRC[type];
    const headerBgColor = `bg-${TYPE_TO_WALLET_DARK_COLOR[type]}` ?? 'bg-grayscale-900';
    const checkBtnClass = checkStatus ? 'generic-vc-card checked' : 'generic-vc-card unchecked';
    const defaultHeaderClass = `flex generic-card-title w-full justify-center ${customHeaderClass}`;


    return (
        <div
            onClick={onClick}
            className={`flex generic-display-card-simple bg-white flex-col shadow-[0_0_8px_0px_rgba(0,0,0,0.2)] relative $ py-[0px] px-[0px] w-[160px] h-[215px] rounded-[20px] overflow-hidden ${className}`}
        >
          

            <section className={defaultThumbClass}>
                {thumbImgSrc && thumbImgSrc?.trim() !== '' && (
                    <img
                        className="generic-display-card-img h-full w-full  w-[110px] h-[110px] rounded-full object-cover overflow-hidden"
                        src={thumbImgSrc ?? ''}
                        alt="Credential Achievement Image"
                    />
                )}
                {(!thumbImgSrc || thumbImgSrc?.trim() === '') && (
                    <img
                        className="max-w-[110px] w-full h-full p-[0px] object-cover rounded-full"
                        src={imgSrc}
                    />
                )}
            </section>

            <section className={defaultHeaderClass}>
                <p className="relative z-[100] small-boost-title text-[14px] p-[0px] font-bold text-center line-clamp-2">
                    {title}
                </p>
            </section>

            <section className="small-boost-card-footer flex justify-center items-center">
                <div className="boost-btn-click">Boost</div>
            </section>
            {showChecked && (
                <div className="check-btn-overlay absolute top-[5px] left-[5px]">
                    <CircleCheckButton
                        checked={checkStatus}
                        onClick={onClick}
                        className={checkBtnClass}
                    />
                </div>
            )}
        </div>
    );
};

export default BoostSmallCard;
