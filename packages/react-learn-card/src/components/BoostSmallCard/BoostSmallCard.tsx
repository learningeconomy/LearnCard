import React from 'react';
import { BoostSmallCardProps, WalletCategoryTypes } from '../../types';
import { TYPE_TO_IMG_SRC, TYPE_TO_WALLET_DARK_COLOR } from '../../constants';
import { CircleCheckButton } from '../CircleCheckButton';
import CaretRightFilled from '../../assets/images/CaretRightFilled.svg';
import DefaultFace from '../../assets/images/default-face.jpeg';
import AddAwardLight from '../../assets/images/addawardlight.svg';

export const BoostSmallCard: React.FC<BoostSmallCardProps> = ({
    title = 'Title Lorem Ipsum',
    thumbImgSrc,
    customThumbClass = '',
    customHeaderClass = '',
    type = WalletCategoryTypes.achievements,
    className,
    onCheckClick,
    showChecked,
    checkStatus,
    arrowOnClick,
    buttonOnClick,
    customButtonComponent,
    customBodyClass,
    customBodyComponent,
    customThumbComponent,
    innerOnClick,
    issueHistory,
    bgImgSrc,
}) => {
    const thumbClass = `bg-${TYPE_TO_WALLET_DARK_COLOR[type]}` ?? 'bg-grayscale-50';
    const defaultThumbClass = `small-boost-card-thumb flex h-[110px] w-[110px] my-[10px] mx-auto ${thumbClass} overflow-hidden flex-col justify-center items-center rounded-full ${customThumbClass}`;
    const imgSrc = thumbImgSrc?.trim() !== '' ? thumbImgSrc : TYPE_TO_IMG_SRC[type];
    const headerBgColor = `bg-${TYPE_TO_WALLET_DARK_COLOR[type]}` ?? 'bg-grayscale-900';
    const checkBtnClass = checkStatus ? 'generic-vc-card checked' : 'generic-vc-card unchecked';
    const defaultHeaderClass = `flex generic-card-title w-full justify-center ${customHeaderClass}`;
    const defaultBodyClass = ` boost-small-card-body flex justify-center items-center text-center text-[14px] overflow-hidden text-grayscale-500 p-[10px] ${customBodyClass}`;
    const defaultButtonClass = `cursor-pointer small-boost-boost-btn flex shadow-bottom boost-btn-click rounded-[40px] w-[140px] h-[48px] text-white flex justify-center items-center ${headerBgColor}`;
    const innerClickContainerClass = `cursor-pointer boost-small-card inner-click-container z-10`;

    const issueHistoryDisplay =
        issueHistory && issueHistory?.length > 3 ? issueHistory?.slice(0, 3) : issueHistory;
    const renderIssueHistory = issueHistoryDisplay?.map(issueItem => {
        return (
            <div
                key={issueItem?.id}
                className="profile-thumb-img border-[2px] border-white border-solid  vc-issuee-image h-[35px] w-[35px] rounded-full overflow-hidden mx-[-5px]"
            >
                <img
                    className="h-full w-full object-cover"
                    src={issueItem?.thumb || DefaultFace}
                    alt="profile"
                />
            </div>
        );
    });

    const handleInnerClick = () => {
        innerOnClick?.();
    };

    return (
        <div
            className={`flex generic-display-card-simple bg-white flex-col shadow-[0_0_8px_0px_rgba(0,0,0,0.2)] relative $ py-[0px] px-[0px] w-[160px] h-[280px] rounded-[20px] overflow-hidden ${className}`}
        >
            {bgImgSrc && (
                <section className="absolute top-[-50px] left-[0px] rounded-b-full overflow-hidden z-0">
                    <img className="h-full w-full object-cover overflow-hidden" src={bgImgSrc} />
                </section>
            )}
            <div className={innerClickContainerClass} onClick={handleInnerClick}>
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
                    <p className="relative z-[100] small-boost-title text-[17px] p-[0px] font-semibold text-center line-clamp-2">
                        {title}
                    </p>
                </section>

                <section className={defaultBodyClass}>
                    {customBodyComponent && customBodyComponent}
                    {!customBodyComponent &&
                        issueHistory &&
                        issueHistory?.length > 0 &&
                        renderIssueHistory}
                    {!customBodyComponent && issueHistory && issueHistory?.length > 3 && (
                        <span className="small-boost-issue-count ml-[10px] font-semibold">
                            +{issueHistory?.length - 3}
                        </span>
                    )}
                </section>
            </div>

            <section className="small-boost-card-footer flex justify-center items-center absolute bottom-[15px] w-full">
                {customButtonComponent && customButtonComponent}

                {!customButtonComponent && (
                    <div onClick={buttonOnClick} className={defaultButtonClass}>
                        <img className="h-[25px] mr-[7px] text-" src={AddAwardLight} />
                        <span className="font-mouse text-[25px] tracking-wider">BOOST!</span>
                    </div>
                )}
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

            {arrowOnClick && (
                <button
                    type="button"
                    onClick={arrowOnClick}
                    className="arrow-btn-overlay absolute top-[52px] right-[2px]"
                >
                    <img
                        className="h-full w-full object-contai"
                        src={CaretRightFilled ?? ''}
                        alt="Right Caret"
                    />
                </button>
            )}
        </div>
    );
};

export default BoostSmallCard;
