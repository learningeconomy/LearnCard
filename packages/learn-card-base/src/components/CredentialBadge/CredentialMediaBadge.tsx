import React, { useState, useEffect } from 'react';

import PlayIcon from 'learn-card-base/svgs/PlayIcon';

import { VC } from '@learncard/types';
import { insertParamsToFilestackUrl } from 'learn-card-base/filestack/images/filestack.helpers';
import { getFilestackPreviewUrl } from 'learn-card-base/filestack/images/images.helpers';
import { getVideoMetadata, VideoMetadata } from 'learn-card-base/helpers/video.helpers';

import { BoostMediaOptionsEnum } from '../boost/boost';
import { boostCategoryOptions } from '../boost/boostOptions/boostOptions';
import { CredentialCategoryEnum } from 'learn-card-base/types/credentials';
import {
    getDefaultCategoryForCredential,
    getExistingAttachmentsOrEvidence,
} from 'learn-card-base/helpers/credentialHelpers';

type CredentialBadgeProps = {
    credential: VC;
    backgroundColor: string;
    badgeContainerCustomClass?: string;
    showIcon?: boolean;
    playIconClassName?: string;
    boostType?: CredentialCategoryEnum;
};

export const CredentialMediaBadge: React.FC<CredentialBadgeProps> = ({
    credential,
    backgroundColor,
    badgeContainerCustomClass,
    showIcon = true,
    playIconClassName,
    boostType,
}) => {
    const defaultCategory = getDefaultCategoryForCredential(credential);

    const displayTypeBackgroundStyles = 'min-h-[120px] max-h-[120px] !rounded-none';
    const { color, SolidIconComponent, IconComponent } =
        boostCategoryOptions?.[boostType ?? defaultCategory] ?? {};
    const [videoMetaData, setVideoMetaData] = useState<VideoMetadata | null>(null);

    const _colorOverride = color ?? 'gray-500';

    const mediaAttachments = getExistingAttachmentsOrEvidence(
        credential?.attachments || [],
        credential?.evidence || []
    );
    const photoAttachments = mediaAttachments.filter(a => a.type === BoostMediaOptionsEnum.photo);
    const documentAttachment = mediaAttachments.find(
        a => a.type === BoostMediaOptionsEnum.document
    );
    const videoAttachment = mediaAttachments.find(a => a.type === BoostMediaOptionsEnum.video);

    useEffect(() => {
        if (videoAttachment?.url) {
            getVideoMetadata(videoAttachment.url).then(setVideoMetaData);
        }
    }, [videoAttachment]);

    let badgeBackground: React.ReactNode = null;

    // Photo preview
    if (photoAttachments.length > 0) {
        const urls = photoAttachments.map(a =>
            insertParamsToFilestackUrl(a.url, 'resize=width:300/quality=value:75/')
        );

        let gridClasses: string;
        if (urls.length === 1) gridClasses = 'grid-cols-1';
        else if (urls.length === 2) gridClasses = 'grid-cols-2';
        else gridClasses = 'grid-cols-2 grid-rows-2';

        const toShow = urls.slice(0, 3);
        const extraCount = urls.length - 3;

        badgeBackground = (
            <div
                className={`absolute z-10 w-full h-full grid ${gridClasses} gap-[2px] overflow-hidden ${displayTypeBackgroundStyles}`}
            >
                {toShow.map((imgUrl, i) => {
                    const spanBoth = urls.length >= 3 && i === 0 ? 'row-span-2' : '';
                    const isOverlaySlot = urls.length > 3 && i === 2;
                    return (
                        <div key={i} className={`relative ${spanBoth}`}>
                            <div
                                className={`absolute inset-0 ${
                                    isOverlaySlot ? 'filter blur-sm' : ''
                                }`}
                                style={{
                                    backgroundImage: `url(${imgUrl})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                            />
                            {isOverlaySlot && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xl font-bold">
                                    +{extraCount}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }
    // Document preview
    else if (documentAttachment?.url) {
        const preview = getFilestackPreviewUrl(documentAttachment.url, {
            width: 300,
            height: 300,
        });
        badgeBackground = (
            <div
                className={`absolute z-10 w-full h-full ${displayTypeBackgroundStyles} bg-${_colorOverride} rounded-br-[100%] rounded-bl-[100%]`}
                style={{
                    backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.4), rgba(0,0,0,0)), url(${preview})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'top',
                }}
            />
        );
    }
    // Video thumbnail + play icon
    else if (videoAttachment && videoMetaData) {
        badgeBackground = (
            <div
                className={`absolute z-10 w-full h-full ${displayTypeBackgroundStyles} bg-${_colorOverride} rounded-br-[100%] rounded-bl-[100%]`}
                style={{
                    backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.4), rgba(0,0,0,0)), url(${videoMetaData.thumbnailUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div className="w-[45px] h-[45px] absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 bg-black rounded-full flex items-center justify-center">
                    <PlayIcon className={`w-[30px] h-[30px] ${playIconClassName}`} />
                </div>
            </div>
        );

        if (!videoMetaData.thumbnailUrl) {
            badgeBackground = (
                <div
                    className={`absolute z-10 w-full h-full ${displayTypeBackgroundStyles} rounded-br-[100%] rounded-bl-[100%] bg-${_colorOverride}`}
                    style={{
                        backgroundColor,
                        backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.4), rgba(0,0,0,0)), url(${videoMetaData.thumbnailUrl})`,
                    }}
                >
                    <IconComponent className="w-[75px] h-[75px] absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2" />
                    <div className="w-[45px] h-[45px] absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 bg-black rounded-full flex items-center justify-center">
                        <PlayIcon className={`w-[30px] h-[30px] ${playIconClassName}`} />
                    </div>
                </div>
            );
        }
    }
    // Fallback icon
    else {
        badgeBackground = (
            <div
                className={`absolute z-10 w-full h-full ${displayTypeBackgroundStyles} rounded-br-[100%] rounded-bl-[100%] bg-${_colorOverride}`}
                style={{ backgroundColor }}
            >
                <IconComponent className="w-[75px] h-[75px] absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2" />
            </div>
        );
    }

    return (
        <div
            className={`relative flex items-center justify-center w-full mt-8 mb-8 select-none ${badgeContainerCustomClass}`}
        >
            {badgeBackground}

            {showIcon && (
                <div className="min-h-[120px] max-h-[120px] w-full relative overflow-visible">
                    <div className="w-[40px] h-[40px] rounded-full bg-white flex items-center justify-center z-[9999] absolute bottom-[-20px] right-[50%] translate-x-[50%]">
                        <SolidIconComponent className="w-[20px] h-[20px] text-gray-500" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CredentialMediaBadge;
