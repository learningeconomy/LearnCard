import React from 'react';
import { BoostGenericCardProps, WalletCategoryTypes } from '../../types';
import { TYPE_TO_IMG_SRC, TYPE_TO_WALLET_DARK_COLOR } from '../../constants';
import { DisplayTypeEnum, getDisplayIcon } from '../../helpers/display.helpers';
import AlignmentSkillsCount from './AlignmentSkillsCount';
import ThreeDotVertical from '../svgs/ThreeDotVertical';
import { CircleCheckButton } from '../CircleCheckButton';
import BadgeThumbnailImg from '../BadgeThumbnailImg/BadgeThumbnailImg';

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
    checkBtnClass = '',
    lifecycleStatus = 'active',
}) => {
    const thumbClass = TYPE_TO_WALLET_DARK_COLOR[type]
        ? `bg-${TYPE_TO_WALLET_DARK_COLOR[type]}`
        : 'bg-grayscale-50';
    const defaultThumbClass = `small-boost-card-thumb flex h-[110px] w-[110px] my-[10px] mx-auto ${thumbClass} overflow-hidden flex-col justify-center items-center rounded-full ${customThumbClass}`;
    const imgSrc = thumbImgSrc?.trim() !== '' ? thumbImgSrc : TYPE_TO_IMG_SRC[type];

    const handleInnerClick = () => innerOnClick?.();
    const handleOptionsClick = () => optionsTriggerOnClick?.();

    const DisplayIcon = getDisplayIcon(displayType as DisplayTypeEnum);

    const isInactive = lifecycleStatus === 'revoked' || lifecycleStatus === 'suspended';
    // Use inline styles for the revoked/suspended treatment (not Tailwind utilities):
    // the consumer app's Tailwind `content` globs don't scan react-learn-card, and this
    // package doesn't ship its own utility CSS, so classes like `grayscale`/`bg-[#DC2626]`
    // defined only here have no backing CSS rule. Inline styles always apply. `filter` on
    // the media containers cascades to their child images.
    const inactiveMediaStyle: React.CSSProperties | undefined = isInactive
        ? { filter: 'grayscale(1) brightness(0.9)' }
        : undefined;
    const inactiveTextStyle: React.CSSProperties | undefined = isInactive
        ? { filter: 'grayscale(1)', opacity: 0.6 }
        : undefined;
    const pillBg = lifecycleStatus === 'revoked' ? '#DC2626' : '#EA580C';
    const pillLeft = showChecked ? 'left-[44px]' : 'left-[8px]';

    return (
        <div
            className={`flex bg-white flex-col shadow-bottom relative p-0 w-[160px] h-[285px] rounded-[20px] overflow-hidden ${className}`}
        >
            {isInactive && (
                <span
                    className={`absolute top-[8px] ${pillLeft} z-20 rounded-full px-[9px] py-[3px] text-[10px] font-extrabold uppercase tracking-wide text-white`}
                    style={{ backgroundColor: pillBg }}
                >
                    {lifecycleStatus === 'revoked' ? 'Revoked' : 'Suspended'}
                </span>
            )}

            {optionsTriggerOnClick && (
                <section
                    className="absolute cursor-pointer h-[30px] w-[30px] top-[5px] right-[5px] rounded-full bg-white/70 flex items-center justify-center z-20"
                    onClick={handleOptionsClick}
                >
                    <ThreeDotVertical className="h-[20px] w-[20px] text-grayscale-900" />
                </section>
            )}

            {bgImgSrc && (
                <section
                    className="absolute top-[-50px] left-0 rounded-b-full overflow-hidden z-0"
                    style={inactiveMediaStyle}
                >
                    <img className="h-full w-full object-cover" src={bgImgSrc} />
                </section>
            )}

            <button
                type="button"
                className="z-10 flex flex-col flex-grow"
                onClick={handleInnerClick}
            >
                {/* Thumbnail — filter on the wrapper so it desaturates a
                    customThumbComponent too, not just the default thumb section. */}
                <div style={inactiveMediaStyle}>
                    {customThumbComponent || (
                        <section className={defaultThumbClass}>
                            {thumbImgSrc?.trim() ? (
                                <BadgeThumbnailImg
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
                </div>

                {/* Details Section: grows to fill available space */}
                <section
                    className={`flex flex-col flex-grow items-center justify-end pt-1 w-full ${
                        linkedCredentialsCount === 0 ? 'pb-[20px]' : ''
                    }`}
                >
                    <div className="px-1 flex flex-col items-center justify-center w-full">
                        {/* Title - dynamically size based on length */}
                        {!customTitle ? (
                            <p
                                className={`
                                ${customHeaderClass}
                                font-medium text-center text-grayscale-900 line-clamp-2
                                h-[50px] flex items-center justify-center
                                ${
                                    (title?.length ?? 0) > 35
                                        ? 'text-[13px] leading-tight'
                                        : 'text-[16px]'
                                }
                            `}
                                style={inactiveTextStyle}
                                title={title}
                            >
                                {title}
                            </p>
                        ) : (
                            customTitle
                        )}

                        {/* Verifier & Issuer */}
                        <div className="mt-1 w-full px-4 text-center">
                            <span className="line-clamp-2 break-words text-[12px] leading-snug text-grayscale-700">
                                {verifierBadge && (
                                    <span className="mr-1 inline-block align-middle">
                                        {verifierBadge}
                                    </span>
                                )}
                                {customIssuerName || (
                                    <span className="font-bold" style={inactiveTextStyle}>
                                        {issuerName}
                                    </span>
                                )}
                            </span>
                        </div>

                        {/* Date */}
                        {customDateDisplay || (
                            <span className="text-[11px] text-grayscale-700 mt-1">
                                {dateDisplay}
                            </span>
                        )}

                        {/* Skills count if in modal */}
                        {isInSkillsModal && credential && (
                            <AlignmentSkillsCount
                                credential={credential}
                                onClick={handleInnerClick}
                                className="mt-[16px]"
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
            {showChecked && (
                <div className="absolute top-[5px] left-[5px] z-20">
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
