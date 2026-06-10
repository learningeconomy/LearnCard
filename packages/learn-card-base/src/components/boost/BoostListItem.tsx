import React, { useMemo } from 'react';
import { IonRow } from '@ionic/react';
import moment from 'moment';
import useGetIssuerName from 'learn-card-base/hooks/useGetIssuerName';
import ThreeDots from 'learn-card-base/svgs/ThreeDots';
import CredentialVerificationDisplay, {
    getInfoFromCredential,
} from '../CredentialBadge/CredentialVerificationDisplay';
import BadgeThumbnailImg from '../CredentialBadge/BadgeThumbnailImg';
import { isDid, formatDidDisplayName } from '@learncard/react';
import {
    getAchievementType,
    getAchievementTypeDisplayText,
    getIssuer,
    getIssuanceDate,
} from 'learn-card-base/helpers/credentialHelpers';
import { CredentialCategory, CredentialCategoryEnum, categoryMetadata } from 'learn-card-base';
import { VC } from '@learncard/types';
import BoostTextSkeleton, { BoostSkeleton } from './boostSkeletonLoaders/BoostSkeletons';
import { BrandingEnum } from '../headerBranding/headerBrandingHelpers';
import {
    DisplayTypeEnum,
    getAttachmentTypeIcon,
    getDisplayIcon,
} from 'learn-card-base/helpers/display.helpers';
import CredentialMediaBadge from '../CredentialBadge/CredentialMediaBadge';
import { BoostMediaOptionsEnum } from './boost';
import { newCredsStore } from 'learn-card-base/stores/newCredsStore';
import DotIcon from '../../svgs/DotIcon';

type BoostListItemProps = {
    title?: string;
    categoryType?: CredentialCategory;
    onClick?: () => void;
    onOptionsClick?: () => void;
    credential: VC;
    loading?: boolean;
    branding?: BrandingEnum;
    linkedCredentialsCount?: number;
    linkedCredentialsClassName?: string;
    displayType?: string;
    thumbImgSrc?: string;
    managedBoost?: boolean;
    uri?: string;
    indicatorColor?: string;
    unknownVerifierTitle?: string;
    relativeDate?: boolean;
    compact?: boolean;
};

const DEFAULT_BG_COLOR = 'bg-white';

const BoostListItem: React.FC<BoostListItemProps> = ({
    title,
    credential,
    categoryType = CredentialCategoryEnum.achievement,
    onClick,
    onOptionsClick,
    loading,
    branding,
    linkedCredentialsCount = 0,
    linkedCredentialsClassName,
    displayType,
    thumbImgSrc,
    managedBoost,
    uri,
    indicatorColor,
    unknownVerifierTitle,
    relativeDate = false,
    compact = false,
}) => {
    const newCreds = newCredsStore.use.newCreds();
    const newCredsForCategory = newCreds?.[categoryType as CredentialCategory] ?? [];
    const showNewItemIndicator = newCredsForCategory?.includes(uri) ?? false;

    const achievementType = useMemo(() => getAchievementType(credential), [credential]);
    const boostTypeDisplayName = useMemo(
        () => getAchievementTypeDisplayText(achievementType, categoryType),
        [achievementType, categoryType]
    );

    const issuanceDateDisplay = useMemo(() => {
        if (relativeDate) return moment(getIssuanceDate(credential)).fromNow();

        const { createdAt } = getInfoFromCredential(credential, 'MMMM DD YYYY', {
            uppercaseDate: false,
        });
        return createdAt;
    }, [credential, relativeDate]);

    const { subColor } = categoryMetadata[categoryType];

    const issuerName = useGetIssuerName(credential);

    const bgColors = useMemo(() => {
        const baseColors = {
            [CredentialCategoryEnum.learningHistory]: 'bg-emerald-500',
            [CredentialCategoryEnum.socialBadge]: 'bg-cyan-500',
            [CredentialCategoryEnum.achievement]: 'bg-orange-300',
            [CredentialCategoryEnum.accomplishment]: 'bg-lime-300',
            [CredentialCategoryEnum.workHistory]: 'bg-blue-300',
            [CredentialCategoryEnum.accommodation]: 'bg-amber-300',
            [CredentialCategoryEnum.id]: 'bg-teal-400',
            [CredentialCategoryEnum.membership]: 'bg-teal-400',
            [CredentialCategoryEnum.meritBadge]: 'bg-teal-400',
        };

        if (branding === BrandingEnum.scoutPass) {
            baseColors[CredentialCategoryEnum.socialBadge] = 'bg-sp-white-opacity-95';
            baseColors[CredentialCategoryEnum.membership] = 'bg-sp-white-opacity-95';
            baseColors[CredentialCategoryEnum.meritBadge] = 'bg-sp-white-opacity-95';
        }

        return baseColors;
    }, [branding]);

    const issuerDid = useMemo(() => {
        const issuer = getIssuer(credential);
        const did = typeof issuer === 'string' ? issuer : issuer?.id;
        return did && isDid(did) ? did : undefined;
    }, [credential]);

    const issuerNode: React.ReactNode = issuerName ? (
        issuerName
    ) : issuerDid ? (
        <>
            <span className="font-semibold text-grayscale-900">Digital ID:</span>{' '}
            <span className="text-grayscale-500 underline">{formatDidDisplayName(issuerDid)}</span>
        </>
    ) : null;

    const backgroundColor = useMemo(
        () => (loading ? 'bg-white' : DEFAULT_BG_COLOR),
        [loading, bgColors, categoryType]
    );

    const DisplayIcon = getDisplayIcon(displayType as DisplayTypeEnum);

    const isMediaDisplay = displayType === DisplayTypeEnum.Media;
    const attachments = credential?.attachments ?? [];
    const attachment = attachments?.[0];
    const { AttachmentIcon, title: attachmentTitle } = getAttachmentTypeIcon(
        attachment?.type as BoostMediaOptionsEnum,
        attachment?.fileType
    );
    const attachmentFileName = attachment?.fileName;
    const attachmentUrl = attachment?.url;

    if (loading) {
        return (
            <IonRow
                className={`rounded-[15px] p-[8px] w-full flex gap-[10px] items-center ${backgroundColor}`}
                data-testid="boost-list-item-loading"
            >
                <div className="relative h-[40px] w-[40px]">
                    <BoostSkeleton
                        containerClassName="w-full h-full"
                        skeletonStyles={{ borderRadius: '100%' }}
                    />
                </div>

                <div className="flex flex-col items-start text-[14px] font-poppins w-[50%] space-y-1">
                    <BoostTextSkeleton
                        containerClassName="w-[60%]"
                        skeletonStyles={{ width: '100%' }}
                    />
                    <BoostTextSkeleton
                        containerClassName="w-[40%]"
                        skeletonStyles={{ width: '100%' }}
                    />
                    <BoostTextSkeleton
                        containerClassName="w-[40%]"
                        skeletonStyles={{ width: '100%' }}
                    />
                </div>
            </IonRow>
        );
    }

    const newItemIndicator = showNewItemIndicator ? (
        <span className="inline-block mr-[2px]">
            <DotIcon className={`text-${indicatorColor}`} />
        </span>
    ) : null;

    const rowPadding = isMediaDisplay ? '' : compact ? 'p-[4px]' : 'p-[8px]';
    const rowGap = compact ? 'gap-[8px]' : 'gap-[10px]';
    const thumbSize = compact ? 'h-[34px] w-[34px]' : 'h-[40px] w-[40px]';
    const textBlockSize = compact ? 'text-[13px]' : 'text-[14px]';
    const verificationIconClass = compact
        ? 'w-[14px] h-[14px] min-w-[14px] min-h-[14px] mr-1 z-50'
        : 'w-[20px] h-[20px] min-w-[20px] min-h-[20px] mr-1 z-50';

    return (
        <IonRow
            className={`${rowPadding} rounded-[15px] relative overflow-hidden w-full flex ${rowGap} items-center ${backgroundColor} z-[2]`}
            onClick={onClick}
            data-testid="boost-list-item"
        >
            {displayType === DisplayTypeEnum.Media ? (
                <div className="relative min-h-[100px] max-w-[100px] flex-1 flex items-center justify-center relative">
                    <CredentialMediaBadge
                        credential={credential}
                        backgroundColor={backgroundColor}
                        badgeContainerCustomClass="!m-0"
                        showIcon={false}
                        playIconClassName="!w-[30px] !h-[30px]"
                    />
                </div>
            ) : (
                <div className={`relative ${thumbSize} rounded-full bg-${subColor}`}>
                    <BadgeThumbnailImg
                        src={
                            thumbImgSrc ||
                            (typeof credential?.image === 'string' && credential.image) ||
                            credential?.credentialSubject?.image ||
                            credential?.boostCredential?.image ||
                            ''
                        }
                        className="rounded-full object-cover h-full w-full"
                    />
                </div>
            )}

            <div
                className={`flex flex-col items-start ${textBlockSize} font-poppins flex-1 min-w-0`}
            >
                {isMediaDisplay && (
                    <>
                        {attachmentFileName ? (
                            <span className="text-grayscale-700 font-semibold">
                                {newItemIndicator} {attachmentTitle}
                            </span>
                        ) : (
                            <a
                                onClick={e => e.stopPropagation()}
                                href={attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-grayscale-900 font-semibold truncate w-full"
                            >
                                {newItemIndicator} {attachmentUrl}
                            </a>
                        )}
                    </>
                )}
                {!isMediaDisplay && (
                    <h3 className="text-grayscale-900 font-semibold truncate w-full leading-tight">
                        {title}
                    </h3>
                )}
                {!isMediaDisplay && !compact && (
                    <span className="text-grayscale-500 font-normal">
                        {newItemIndicator} {boostTypeDisplayName}
                    </span>
                )}

                <span
                    className={`font-normal flex items-center w-full min-w-0 ${
                        compact
                            ? 'text-grayscale-600 text-[11px] leading-tight mt-0.5'
                            : 'text-grayscale-800'
                    }`}
                >
                    {(isMediaDisplay || displayType !== DisplayTypeEnum.Media) && !managedBoost && (
                        <CredentialVerificationDisplay
                            managedBoost={managedBoost}
                            credential={credential}
                            iconClassName={verificationIconClass}
                            unknownVerifierTitle={unknownVerifierTitle}
                        />
                    )}
                    {compact ? (
                        <>
                            {newItemIndicator}
                            {boostTypeDisplayName}
                            {boostTypeDisplayName && (
                                <span className="mx-1 text-grayscale-400">·</span>
                            )}
                            {issuanceDateDisplay}
                        </>
                    ) : (
                        <>
                            {issuerNode && <span className="truncate min-w-0">{issuerNode}</span>}
                            {issuerNode && (
                                <span className="shrink-0 px-1.5 text-grayscale-400">•</span>
                            )}
                            <span className="shrink-0 whitespace-nowrap">
                                {issuanceDateDisplay}
                            </span>
                        </>
                    )}
                </span>
            </div>

            {onOptionsClick && (
                <div
                    onClick={e => e.stopPropagation()}
                    className={`self-stretch flex items-center bg-white ${
                        isMediaDisplay ? 'p-[8px]' : ''
                    }`}
                >
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            onOptionsClick();
                        }}
                        className="flex !h-full items-start justify-start h-[20px] w-[20px] ml-auto bg-white"
                        aria-label="More options"
                    >
                        <ThreeDots className="text-grayscale-900" />
                    </button>
                </div>
            )}

            {linkedCredentialsCount > 0 && (
                <div
                    className={`flex-1 absolute right-0 bottom-0 w-[66px] h-[35px] flex items-center justify-center z-[3] rounded-tl-[10px]  ${linkedCredentialsClassName}`}
                >
                    <DisplayIcon className="w-[20px] h-[20px]" />
                    <span className="text-white font-semibold text-[14px] ml-1">
                        +{linkedCredentialsCount}
                    </span>
                </div>
            )}
        </IonRow>
    );
};

export default BoostListItem;
