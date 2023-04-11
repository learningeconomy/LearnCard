import React from 'react';
import { BoostGenericCardProps, WalletCategoryTypes } from '../../types';
import { TYPE_TO_IMG_SRC, TYPE_TO_WALLET_DARK_COLOR } from '../../constants';
import { CircleCheckButton } from '../CircleCheckButton';
import CaretRightFilled from '../../assets/images/CaretRightFilled.svg';
import DefaultFace from '../../assets/images/default-face.jpeg';
import AddAwardLight from '../../assets/images/addawardlight.svg';

export const BoostGenericCard: React.FC<BoostGenericCardProps> = ({
    title,
    thumbImgSrc,
    customThumbClass = '',
    customHeaderClass = '',
    type = WalletCategoryTypes.achievements,
    className,
    onCheckClick,
    showChecked,
    checkStatus,
    customThumbComponent,
    innerOnClick,
    bgImgSrc,
    issuerName,
    dateDisplay,
}) => {
    const thumbClass = `bg-${TYPE_TO_WALLET_DARK_COLOR[type]}` ?? 'bg-grayscale-50';
    const defaultThumbClass = `small-boost-card-thumb flex h-[110px] w-[110px] my-[10px] mx-auto ${thumbClass} overflow-hidden flex-col justify-center items-center rounded-full ${customThumbClass}`;
    const imgSrc = thumbImgSrc?.trim() !== '' ? thumbImgSrc : TYPE_TO_IMG_SRC[type];
    const headerBgColor = `bg-${TYPE_TO_WALLET_DARK_COLOR[type]}` ?? 'bg-grayscale-900';
    const checkBtnClass = checkStatus ? 'generic-vc-card checked' : 'generic-vc-card unchecked';
    const defaultHeaderClass = `flex generic-card-title w-full justify-center ${customHeaderClass}`;

    const handleInnerClick = () => {
        innerOnClick?.();
    };

    return (
        <div
            className={`flex generic-display-card-simple bg-white flex-col shadow-[0_0_8px_0px_rgba(0,0,0,0.2)] relative $ py-[0px] px-[0px] w-[160px] h-[250px] rounded-[20px] overflow-hidden ${className}`}
        >
            {bgImgSrc && (
                <section className="absolute top-[-50px] left-[0px] rounded-b-full overflow-hidden z-0">
                    <img className="h-full w-full object-cover overflow-hidden" src={bgImgSrc} />
                </section>
            )}
            <div className="boost-small-card inner-click-containe z-10" onClick={handleInnerClick}>
                {customThumbComponent && customThumbComponent}
                {!customThumbComponent && (
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
                )}

                <section className={defaultHeaderClass}>
                    <p className="relative z-[100] small-boost-title text-[17px] p-[0px] font-semibold text-center  text-grayscale-900 line-clamp-2">
                        {title}
                    </p>
                </section>

                <section className="small-generic-boost-card-footer flex flex-col justify-center items-center absolute bottom-[15px] w-full">
                    <span className="flex items-center justify-center small-generic-boost-issuer-name line-clamp-1 text-[12px] text-grayscale-700 font-bold px-[6px]">
                        by {issuerName}
                    </span>
                    <p className="small-generic-boost-date-display line-clamp-1 text-[12px] text-grayscale-700  px-[7px]">
                        {dateDisplay}
                    </p>
                </section>
                {showChecked && (
                    <div className="check-btn-overlay absolute top-[5px] left-[5px]">
                        <CircleCheckButton
                            checked={checkStatus}
                            onClick={onCheckClick}
                            className={checkBtnClass}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default BoostGenericCard;
