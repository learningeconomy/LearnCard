import React from 'react';
import { BoostGenericCardProps, WalletCategoryTypes } from '../../types';
import { TYPE_TO_IMG_SRC, TYPE_TO_WALLET_DARK_COLOR } from '../../constants';
import { CircleCheckButton } from '../CircleCheckButton';
import ThreeDots from '../../assets/images/DotsThreeOutline.svg';
import { DisplayTypeEnum, getDisplayIcon } from '../../helpers/display.helpers';
import { CertDisplayCardSkillsCount } from '../CertificateDisplayCard';

export const BoostGenericCard: React.FC<BoostGenericCardProps> = ({
    title,
    customTitle,
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
    customIssuerName,
    dateDisplay,
    customDateDisplay,
    optionsTriggerOnClick,
    verifierBadge,
    credential,
    isInSkillsModal,
    displayType,
    linkedCredentialsCount = 0,
    linkedCredentialsClassName = '',
}) => {
    const thumbClass = TYPE_TO_WALLET_DARK_COLOR[type]
        ? `bg-${TYPE_TO_WALLET_DARK_COLOR[type]}`
        : 'bg-grayscale-50';
    const defaultThumbClass = `small-boost-card-thumb flex h-[110px] w-[110px] my-[10px] mx-auto ${thumbClass} overflow-hidden flex-col justify-center items-center rounded-full ${customThumbClass}`;
    const imgSrc = thumbImgSrc?.trim() !== '' ? thumbImgSrc : TYPE_TO_IMG_SRC[type];
    const headerBgColor = TYPE_TO_WALLET_DARK_COLOR[type]
        ? `bg-${TYPE_TO_WALLET_DARK_COLOR[type]}`
        : 'bg-grayscale-900';
    const checkBtnClass = checkStatus ? 'generic-vc-card checked' : 'generic-vc-card unchecked';
    const defaultHeaderClass = `flex generic-card-title w-full justify-center ${customHeaderClass}`;
    const linkedCredentialsCountStyles =
        linkedCredentialsCount > 0 ? `rounded-b-[0px] !shadow-none` : '';

    const handleInnerClick = () => {
        innerOnClick?.();
    };

    const handleOptionsClick = () => {
        optionsTriggerOnClick?.();
    };

    const DisplayIcon = getDisplayIcon(displayType as DisplayTypeEnum);

    return (
        <div
            className={`flex generic-display-card-simple bg-white flex-col shadow-bottom relative py-[0px] px-[0px] w-[160px] h-[270px] rounded-[20px] overflow-hidden ${linkedCredentialsCountStyles} ${className}`}
        >
            {optionsTriggerOnClick && (
                <section
                    className="absolute cursor-pointer shadow-bottom h-[30px] w-[30px] top-[5px] right-[5px] rounded-full overflow-hidden z-20 bg-white flex items-center justify-center"
                    onClick={handleOptionsClick}
                >
                    <img
                        alt="Menu dropdown icon"
                        className="h-[20px] w-[20px] object-cover overflow-hidden"
                        src={ThreeDots}
                    />
                </section>
            )}

            {bgImgSrc && (
                <section className="absolute top-[-50px] shadow-bottom left-[0px] rounded-b-full overflow-hidden z-0 mt-3">
                    <img className="h-full w-full object-cover overflow-hidden" src={bgImgSrc} />
                </section>
            )}
            <button
                type="button"
                className="boost-small-card inner-click-container z-10"
                onClick={handleInnerClick}
            >
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
                <section className="boost-generic-info-section">
                    {!customTitle && (
                        <div className={`${defaultHeaderClass} items-center`}>
                            <p className="relative z-[100] small-boost-title text-[16px] leading-[130%] px-[0px] font-medium text-center text-grayscale-900 line-clamp-2 max-w-full">
                                {title}
                            </p>
                        </div>
                    )}

                    {customTitle && customTitle}

                    {customIssuerName && customIssuerName}
                    {!customIssuerName && (
                        <span className="flex items-center justify-center small-generic-boost-issuer-name line-clamp-1 text-[12px] text-grayscale-700 px-[6px]">
                            by <span className="font-bold whitespace-pre"> {issuerName}</span>
                        </span>
                    )}

                    {customDateDisplay && customDateDisplay}
                    {!customDateDisplay && (
                        <p className="small-generic-boost-date-display line-clamp-1 flex items-center justify-center text-center text-[12px] text-grayscale-700  px-[7px]">
                            {verifierBadge}
                            {dateDisplay}
                        </p>
                    )}

                    {isInSkillsModal && (
                        <CertDisplayCardSkillsCount
                            skills={credential?.skills ?? []}
                            onClick={handleInnerClick}
                            className={'boost-generic'}
                            isInSkillsModal={isInSkillsModal}
                        />
                    )}
                </section>
            </button>

            {linkedCredentialsCount > 0 && (
                <div
                    className={`absolute bottom-0 left-0 h-[20px] w-full rounded-b-[20px] flex items-center justify-center py-4 mt-1 ${linkedCredentialsClassName}`}
                >
                    <DisplayIcon className={`h-[20px] w-[20px]`} />{' '}
                    <span className="ml-2 font-poppins text-sm font-semibold text-white">
                        +{linkedCredentialsCount} Linked
                    </span>
                </div>
            )}

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
    );
};

export default BoostGenericCard;
