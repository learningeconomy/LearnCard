import React from 'react';

import BoostTextSkeleton from 'learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons';

import { DisplayTypeEnum, getAttachmentTypeIcon, BoostMediaOptionsEnum } from 'learn-card-base';
import { VC } from '@learncard/types';
import DotIcon from 'learn-card-base/svgs/DotIcon';

export const CustomBoostTitleDisplay: React.FC<{
    displayType?: DisplayTypeEnum;
    showSkeleton?: boolean;
    title?: string;
    formattedDisplayType?: string;
    textColor?: string;
    credential?: VC;
    mediaTitleContainerClassName?: string;
    isEarnedBoost?: boolean;
    showNewItemIndicator?: boolean;
    indicatorColor?: string;
}> = ({
    displayType,
    showSkeleton,
    title = '',
    formattedDisplayType = '',
    textColor = '',
    credential,
    mediaTitleContainerClassName,
    isEarnedBoost = false,
    showNewItemIndicator = false,
    indicatorColor = '',
}) => {
    const attachments = credential?.attachments ?? [];
    const attachment = attachments?.[0];
    const { AttachmentIcon, title: attachmentTitle } = getAttachmentTypeIcon(
        attachment?.type as BoostMediaOptionsEnum,
        attachment?.fileType
    );

    const newItemIndicator = showNewItemIndicator ? (
        <span className="inline-block mr-[2px]">
            <DotIcon className={`text-${indicatorColor}`} />
        </span>
    ) : null;

    if (showSkeleton) {
        return (
            <div className="w-full flex items-center justify-center pt-2">
                <BoostTextSkeleton
                    containerClassName="w-full flex items-center justify-center"
                    skeletonStyles={{ width: '80%' }}
                />
            </div>
        );
    }

    if (displayType === DisplayTypeEnum.Media) {
        return (
            <div
                className={`flex flex-col items-center justify-center mt-[4px] ${mediaTitleContainerClassName}`}
            >
                <div className="relative h-[40px] px-[8px] text-center overflow-hidden w-full flex flex-col items-center justify-center">
                    <span className="w-full text-grayscale-900 text-[16px] font-notoSans font-semibold leading-[125%] line-clamp-2">
                        {title}
                    </span>
                </div>
                <span
                    className={`w-full text-center text-${textColor} text-[12px] font-[600] uppercase font-notoSans px-[7px] line-clamp-1`}
                >
                    {newItemIndicator} {formattedDisplayType}
                </span>
                {/* <div
                    className={`w-full flex items-center justify-center text-grayscale-800 text-[12px] font-[600] font-notoSans`}
                >
                    <AttachmentIcon className="mr-1" /> {attachmentTitle}
                </div> */}
            </div>
        );
    }

    if (isEarnedBoost) {
        return (
            <div className="flex flex-col items-center justify-center mt-[4px] w-full">
                <div className="relative h-[40px] px-[8px] text-center overflow-hidden w-full flex items-center justify-center">
                    <span className="w-full text-grayscale-900 text-[16px] font-notoSans font-semibold leading-[125%] line-clamp-2">
                        {title}
                    </span>
                </div>
                <span
                    className={`w-full text-center text-${textColor} text-[12px] font-[600] uppercase font-notoSans px-[7px] line-clamp-1`}
                >
                    {newItemIndicator} {formattedDisplayType}
                </span>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center mt-[4px] w-full">
            <span className="text-grayscale-900 text-[16px] font-notoSans font-semibold text-center leading-[125%] line-clamp-2 px-[8px] !z-[9999]">
                {title}
            </span>
            <span
                className={`w-full text-center text-${textColor} text-[12px] font-[600] uppercase font-notoSans px-[7px] line-clamp-1`}
            >
                {newItemIndicator} {formattedDisplayType}
            </span>
        </div>
    );
};

export default CustomBoostTitleDisplay;
