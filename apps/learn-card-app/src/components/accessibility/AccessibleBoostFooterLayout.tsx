import React from 'react';

import ExpandIcon from 'learn-card-base/svgs/ExpandIcon';
import ReplyIcon from 'learn-card-base/svgs/ReplyIcon';
import ThreeDots from 'learn-card-base/svgs/ThreeDots';
import X from 'learn-card-base/svgs/X';
import { useT } from 'learn-card-base/i18n';
import type { BoostFooterProps } from 'learn-card-base/components/boost/boostFooter/BoostFooter';

type AccessibleBoostFooterLayoutProps = React.PropsWithChildren<{
    footerProps?: BoostFooterProps;
    className?: string;
    contentClassName?: string;
    footerClassName?: string;
    contentOwnsScroll?: boolean;
}>;

const AccessibleBoostFooter: React.FC<BoostFooterProps> = props => {
    const t = useT();
    const propsCount = Object.values(props).filter(value => value !== undefined).length;
    const {
        claimBtnText,
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
        <footer
            className="w-full min-h-[85px] bg-white border-white border-t-1px bg-opacity-60 border-t-[1px] sticky bottom-0 px-[20px] pt-[20px] backdrop-blur-[10px]"
            style={{ paddingBottom: 'calc(20px + var(--ion-safe-area-bottom, 0px))' }}
        >
            <div className="max-w-[600px] mx-auto flex gap-[10px]">
                {handleClose && (propsCount === 2 || isIdClaim || useFullCloseButton) && (
                    <button
                        type="button"
                        onClick={handleClose}
                        className="bg-white py-[9px] px-[15px] rounded-[30px] font-notoSans text-[17px] text-grayscale-900 w-full shadow-button-bottom"
                    >
                        {t('boostFooter.close')}
                    </button>
                )}

                {handleClose && propsCount > 2 && !isIdClaim && !useFullCloseButton && (
                    <button
                        type="button"
                        aria-label={t('boostFooter.close')}
                        onClick={handleClose}
                        className="bg-white rounded-full text-grayscale-900 py-[10px] px-[12px] shadow-button-bottom"
                    >
                        <span aria-hidden="true">
                            <X className="h-[20px] w-[20px] text-grayscale-900" />
                        </span>
                    </button>
                )}

                {handleX && (
                    <button
                        type="button"
                        aria-label={t('boostFooter.close')}
                        onClick={handleX}
                        className="bg-white rounded-full text-grayscale-900 py-[10px] px-[12px] shadow-button-bottom"
                    >
                        <span aria-hidden="true">
                            <X className="h-[20px] w-[20px] text-grayscale-900" />
                        </span>
                    </button>
                )}

                {handleBack && (
                    <button
                        type="button"
                        onClick={handleBack}
                        className="bg-white py-[9px] px-[15px] rounded-[30px] font-notoSans text-[17px] text-grayscale-900 w-full shadow-button-bottom"
                    >
                        {t('boostFooter.back')}
                    </button>
                )}

                {handleDetails && (
                    <button
                        type="button"
                        onClick={handleDetails}
                        className="bg-white py-[9px] px-[15px] rounded-[30px] font-notoSans text-[17px] text-grayscale-900 w-full shadow-button-bottom"
                    >
                        {t('boostFooter.details')}
                    </button>
                )}

                {showFullScreen && (
                    <button
                        type="button"
                        aria-label="Enter full screen"
                        onClick={handleFullScreen}
                        className="bg-white rounded-full text-grayscale-900 py-[10px] px-[12px] shadow-button-bottom"
                    >
                        <span aria-hidden="true">
                            <ExpandIcon />
                        </span>
                    </button>
                )}

                {handleShare && showShareButton && (
                    <button
                        type="button"
                        onClick={handleShare}
                        className="bg-grayscale-800 py-[9px] pl-[20px] pr-[15px] rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-white w-full shadow-button-bottom flex gap-[5px] justify-center"
                    >
                        {t('boostFooter.share')}
                        <span aria-hidden="true">
                            <ReplyIcon className="text-white" />
                        </span>
                    </button>
                )}

                {handleClaim && !isIdClaim && (
                    <button
                        type="button"
                        onClick={handleClaim}
                        className="bg-grayscale-800 py-[9px] pl-[20px] pr-[15px] rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-white w-full shadow-button-bottom flex gap-[5px] justify-center disabled:opacity-70"
                        disabled={disableClaimButton}
                    >
                        {claimBtnText ?? t('boostFooter.accept')}
                    </button>
                )}

                {handleDotMenu && (
                    <button
                        type="button"
                        aria-label="More options"
                        onClick={handleDotMenu}
                        className="bg-white rounded-full text-grayscale-900 py-[10px] px-[12px] shadow-button-bottom"
                    >
                        <span aria-hidden="true">
                            <ThreeDots className="text-grayscale-900" />
                        </span>
                    </button>
                )}
            </div>
        </footer>
    );
};

const AccessibleBoostFooterLayout: React.FC<AccessibleBoostFooterLayoutProps> = ({
    children,
    footerProps,
    className = '',
    contentClassName = '',
    footerClassName = '',
    contentOwnsScroll = false,
}) => (
    <div className={`relative flex min-h-0 w-full flex-1 flex-col ${className}`}>
        <div
            className={`min-h-0 flex-1 ${
                contentOwnsScroll ? 'overflow-hidden' : 'overflow-y-auto'
            } ${contentClassName}`}
        >
            {children}
        </div>

        {footerProps && (
            <div className={`relative z-10 w-full shrink-0 ${footerClassName}`}>
                <AccessibleBoostFooter {...footerProps} />
            </div>
        )}
    </div>
);

export default AccessibleBoostFooterLayout;
