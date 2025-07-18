import React from 'react';
import { BoostGenericCardProps, WalletCategoryTypes } from '../../types';
import { TYPE_TO_IMG_SRC, TYPE_TO_WALLET_DARK_COLOR } from '../../constants';
import { DisplayTypeEnum, getDisplayIcon } from '../../helpers/display.helpers';
import { CertDisplayCardSkillsCount } from '../CertificateDisplayCard';
import ThreeDotVertical from '../svgs/ThreeDotVertical';

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

    const handleInnerClick = () => innerOnClick?.();
    const handleOptionsClick = () => optionsTriggerOnClick?.();

    const DisplayIcon = getDisplayIcon(displayType as DisplayTypeEnum);

    return (
        <div
            className={`flex bg-white flex-col shadow-bottom relative p-0 w-[160px] h-[265px] rounded-[20px] overflow-hidden ${className}`}
        >
            {optionsTriggerOnClick && (
                <section
                    className="absolute cursor-pointer h-[30px] w-[30px] top-[5px] right-[5px] rounded-full bg-white/70 flex items-center justify-center z-20"
                    onClick={handleOptionsClick}
                >
                    <ThreeDotVertical className="h-[20px] w-[20px] text-grayscale-900" />
                </section>
            )}

            {bgImgSrc && (
                <section className="absolute top-[-50px] left-0 rounded-b-full overflow-hidden z-0">
                    <img className="h-full w-full object-cover" src={bgImgSrc} />
                </section>
            )}

            <button
                type="button"
                className="z-10 flex flex-col flex-grow"
                onClick={handleInnerClick}
            >
                {/* Thumbnail */}
                {customThumbComponent || (
                    <section className={defaultThumbClass}>
                        {thumbImgSrc?.trim() ? (
                            <img
                                className="w-full h-full rounded-full object-cover"
                                src={thumbImgSrc}
                                alt="Credential Achievement"
                            />
                        ) : (
                            <img
                                className="max-w-full p-0 object-cover rounded-full"
                                src={imgSrc}
                            />
                        )}
                    </section>
                )}

                {/* Details Section: grows to fill available space */}
                <section
                    className={`flex flex-col flex-grow items-center justify-end pt-1 ${
                        linkedCredentialsCount === 0 ? 'pb-[20px]' : ''
                    }`}
                >
                    <div className="px-1 flex flex-col items-center justify-center">
                        {/* Title */}
                        {!customTitle ? (
                            <p
                                className={`${customHeaderClass} text-[16px] font-medium text-center text-grayscale-900 line-clamp-2`}
                            >
                                {title}
                            </p>
                        ) : (
                            customTitle
                        )}

                        {/* Issuer */}
                        {customIssuerName || (
                            <span className="text-[12px] text-grayscale-700 mt-1">
                                by <span className="font-bold">{issuerName}</span>
                            </span>
                        )}

                        {/* Date & Verifier */}
                        {customDateDisplay || (
                            <p className="text-[12px] text-grayscale-700 mt-1 flex items-center">
                                {verifierBadge}
                                {dateDisplay}
                            </p>
                        )}

                        {/* Skills count if in modal */}
                        {isInSkillsModal && (
                            <CertDisplayCardSkillsCount
                                skills={credential?.skills || []}
                                onClick={handleInnerClick}
                                isInSkillsModal={isInSkillsModal}
                            />
                        )}
                    </div>

                    {/* Linked Credentials moved inside details */}
                    {linkedCredentialsCount > 0 && (
                        <div
                            className={`mt-auto flex items-center justify-center py-1 w-full ${linkedCredentialsClassName}`}
                        >
                            <DisplayIcon className="h-[20px] w-[20px] text-grayscale-900" />
                            <span className="ml-1 text-sm font-semibold text-grayscale-900">
                                +{linkedCredentialsCount} Linked
                            </span>
                        </div>
                    )}
                </section>
            </button>

            {/* Optional Check Button overlay */}
            {/* {showChecked && (
        <div className="absolute top-[5px] left-[5px]">
          <CircleCheckButton checked={checkStatus} onClick={onCheckClick} className={checkBtnClass} />
        </div>
      )} */}
        </div>
    );
};

export default BoostGenericCard;
