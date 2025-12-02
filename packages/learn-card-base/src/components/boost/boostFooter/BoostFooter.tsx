import React from 'react';
import { useModal } from 'learn-card-base';
import ReplyIcon from 'learn-card-base/svgs/ReplyIcon';
import ThreeDots from 'learn-card-base/svgs/ThreeDots';
import X from 'learn-card-base/svgs/X';
import ExpandIcon from 'learn-card-base/svgs/ExpandIcon';

type BoostFooterProps = {
    handleShare?: () => void;
    handleClaim?: () => void;
    handleBack?: () => void;
    handleClose?: () => void;
    handleDetails?: () => void;
    handleDotMenu?: () => void;
    handleX?: () => void;
    claimBtnText?: string;
    isIdClaim?: boolean;
    disableClaimButton?: boolean;
    useFullCloseButton?: boolean;
    showShareButton?: boolean;
    showFullScreen?: boolean;
    handleFullScreen?: () => void;
};

const BoostFooter: React.FC<BoostFooterProps> = props => {
    const propsCount = Object.values(props).filter(value => value !== undefined).length;
    const {
        claimBtnText = 'Accept',
        handleShare,
        handleBack,
        handleX,
        handleClose,
        handleDetails,
        handleDotMenu,
        handleClaim,
        isIdClaim,
        disableClaimButton,
        useFullCloseButton,
        showShareButton = true,
        showFullScreen,
        handleFullScreen,
    } = props;

    return (
        <footer className="w-full bg-white border-white border-t-1px bg-opacity-60 border-t-[1px] sticky bottom-0 p-[20px] backdrop-blur-[10px] h-[85px]">
            <div className="max-w-[600px] mx-auto flex gap-[10px]">
                {handleClose && (propsCount === 2 || isIdClaim || useFullCloseButton) && (
                    <button
                        onClick={() => {
                            handleClose?.();
                        }}
                        className="bg-white py-[9px] px-[15px] rounded-[30px] font-notoSans text-[17px] text-grayscale-900 w-full shadow-button-bottom "
                    >
                        Close
                    </button>
                )}

                {handleClose && propsCount > 2 && !isIdClaim && !useFullCloseButton && (
                    <button
                        onClick={() => handleClose?.()}
                        className="bg-white rounded-full text-grayscale-900 py-[10px] px-[12px] shadow-button-bottom "
                    >
                        <X className="h-[20px] w-[20px] text-grayscale-900" />
                    </button>
                )}

                {/* {handleDotMenu && (
                <button className="bg-white rounded-full text-grayscale-900 py-[10px] px-[12px] shadow-button-bottom">
                            <ThreeDots />
                 </button>
                  )}
               */}

                {handleX && (
                    <button
                        onClick={() => handleX?.()}
                        className="bg-white rounded-full text-grayscale-900 py-[10px] px-[12px] shadow-button-bottom "
                    >
                        <X className="h-[20px] w-[20px] text-grayscale-900" />
                    </button>
                )}

                {handleBack && (
                    <button
                        onClick={() => {
                            handleBack?.();
                        }}
                        className="bg-white py-[9px] px-[15px] rounded-[30px] font-notoSans text-[17px] text-grayscale-900 w-full shadow-button-bottom "
                    >
                        Back
                    </button>
                )}

                {handleDetails && (
                    <button
                        onClick={() => {
                            handleDetails?.();
                        }}
                        className="bg-white py-[9px] px-[15px] rounded-[30px] font-notoSans text-[17px] text-grayscale-900 w-full shadow-button-bottom "
                    >
                        Details
                    </button>
                )}

                {showFullScreen && (
                    <button
                        onClick={() => handleFullScreen?.()}
                        className="bg-white rounded-full text-grayscale-900 py-[10px] px-[12px] shadow-button-bottom "
                    >
                        <ExpandIcon />
                    </button>
                )}

                {handleShare && showShareButton && (
                    <button
                        onClick={() => handleShare?.()}
                        className="bg-grayscale-800 py-[9px] pl-[20px] pr-[15px] rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-white w-full shadow-button-bottom flex gap-[5px] justify-center"
                    >
                        Share
                        <ReplyIcon className="text-white" />
                    </button>
                )}

                {handleClaim && !isIdClaim && (
                    <button
                        onClick={() => handleClaim?.()}
                        className="bg-grayscale-800 py-[9px] pl-[20px] pr-[15px] rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-white w-full shadow-button-bottom flex gap-[5px] justify-center disabled:opacity-70"
                        disabled={disableClaimButton}
                    >
                        {claimBtnText}
                    </button>
                )}

                {handleDotMenu && (
                    <button
                        onClick={() => handleDotMenu?.()}
                        className="bg-white rounded-full text-grayscale-900 py-[10px] px-[12px] shadow-button-bottom"
                    >
                        <ThreeDots className="text-grayscale-900" />
                    </button>
                )}
            </div>
        </footer>
    );
};

export default BoostFooter;
