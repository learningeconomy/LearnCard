import React from 'react';
import { VC } from '@learncard/types';
import { getAttachmentTypeIcon, BoostMediaOptionsEnum } from 'learn-card-base';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

import useTheme from '../../../../theme/hooks/useTheme';

export const BoostSideMenuMediaDetails: React.FC<{ credential: VC }> = ({ credential }) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const attachments = credential?.attachments ?? [];

    const imageAttachments = attachments.filter(a => a?.type === BoostMediaOptionsEnum.photo);
    const nonImageAttachment = attachments.find(a => a?.type !== BoostMediaOptionsEnum.photo);

    const handleClick = async (url?: string) => {
        if (!url) return;
        if (Capacitor?.isNativePlatform()) {
            await Browser.open({ url });
        } else {
            window.open(url, '_blank');
        }
    };

    // Render image list (one icon, many buttons)
    if (imageAttachments.length > 0) {
        const { AttachmentIcon, title: attachmentType } = getAttachmentTypeIcon(
            BoostMediaOptionsEnum.photo
        );

        return (
            <div className="w-full flex items-start justify-start">
                <div className="flex items-center justify-center mr-[12px] pt-[2px]">
                    <AttachmentIcon className="w-[40px] h-[40px]" />
                </div>
                <div className="flex flex-1 flex-col items-start justify-center overflow-hidden">
                    <p className="text-left text-sm font-[600] font-notoSans text-grayscale-900 mb-[4px]">
                        {attachmentType}
                    </p>
                    <div className="w-full flex flex-wrap gap-x-1 gap-y-1 text-sm font-[600] font-notoSans text-grayscale-900">
                        {imageAttachments.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleClick(img?.url)}
                                className="hover:underline focus:outline-none text-left break-words"
                            >
                                {img?.fileName || img?.url}
                                {idx < imageAttachments.length - 1 && ','}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Fallback: show first non-image attachment with subLabel
    if (nonImageAttachment) {
        const { type, fileName, url, fileType, title } = nonImageAttachment;
        const { AttachmentIcon, title: attachmentType } = getAttachmentTypeIcon(
            type as BoostMediaOptionsEnum,
            fileType
        );

        let subLabel = fileName;
        if (type === BoostMediaOptionsEnum.video) subLabel = url;
        if (type === BoostMediaOptionsEnum.document) subLabel = fileName;

        return (
            <div
                className="w-full flex items-center justify-start cursor-pointer"
                onClick={() => handleClick(url)}
            >
                <div className="flex items-center justify-center mr-[12px]">
                    <AttachmentIcon className="w-[40px] h-[40px]" />
                </div>
                <div className="flex flex-1 flex-col items-start justify-center overflow-hidden">
                    <p className="text-left text-sm font-[600] font-notoSans text-grayscale-900">
                        {attachmentType}
                    </p>
                    <p
                        className={`text-left text-sm font-[600] font-notoSans text-${primaryColor} break-all`}
                    >
                        {subLabel}
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export default BoostSideMenuMediaDetails;
