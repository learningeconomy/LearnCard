import React from 'react';
import { EmojiClickData } from 'emoji-picker-react';

import IDSleeve from 'learn-card-base/svgs/IDSleeve';
import CrescentCornerLeft from '../../svgs/CrescentCornerLeft';
import CrescentCornerRight from '../../svgs/CrescentCornerRight';
import FamilyCMSThumbnail from '../FamilyCMSThumbnail/FamilyCMSThumbnail';
import EmojiRenderer from '../FamilyCMSEmojiPicker/FamilyCMSEmojiRenderer';
import QRCodeScanner from '../../svgs/QRCodeScanner';
import { truncateWithEllipsis } from 'learn-card-base';

export const FamilyCrest: React.FC<{
    thumbnail?: string;
    emoji?: EmojiClickData | null;
    showEmoji?: boolean;
    familyName?: string;
    familyMotto?: string;
    showFullMotto?: boolean;
    headerBackgroundColor?: string;
    headerFontColor?: string;
    showMinified?: boolean;
    containerClassName?: string;
    ribbonClassName?: string;
    imageClassName?: string;
    showSleeve?: boolean;
    showQRCode?: boolean;
    qrCodeOnClick?: () => void;
    children?: React.ReactNode;
}> = ({
    thumbnail,
    emoji,
    showEmoji,
    familyName,
    familyMotto,
    showFullMotto,
    headerBackgroundColor,
    headerFontColor,
    showMinified,
    containerClassName,
    ribbonClassName,
    imageClassName,
    showSleeve = true,
    showQRCode,
    qrCodeOnClick,
    children,
}) => {
    const _familyName = truncateWithEllipsis(familyName ?? '', 25);

    if (showMinified) {
        return (
            <div className={`w-full relative ${containerClassName}`}>
                <FamilyCMSThumbnail className={imageClassName} thumbnail={thumbnail} />

                <div
                    className={`w-full z-[99999] absolute bottom-[60px] right-[50%] translate-x-[50%] flex items-center justify-center ${ribbonClassName}`}
                >
                    <div className="bg-white flex flex-col items-center justify-center z-9999 relative">
                        {emoji?.unified && showEmoji && (
                            <div className="bg-white rounded-full h-[40px] w-[40px] absolute top-[-20px] right-[50%] translate-x-[50%] flex items-center justify-center shadow-soft-top">
                                <span className="mb-2">
                                    <EmojiRenderer data={emoji} size={20} />
                                </span>
                            </div>
                        )}
                        <p className="text-gray-900 px-4 py-1 text-xs z-9999 shadow-soft-bottom">
                            {_familyName}
                            <CrescentCornerLeft className="absolute bottom-[-13px] left-[-4px] z-0 !h-[15px]" />
                            <CrescentCornerRight className="absolute bottom-[-13px] right-[-4px] z-0 !h-[15px]" />
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`rounded-t-[20px] flex flex-col mt-[100px] ${containerClassName}`}>
            <div className="w-full flex items-center justify-center flex-col bg-opacity-70 rounded-t-[20px] backdrop-blur-[5px] bg-white">
                <div className="w-full relative">
                    <div className="absolute top-[-75px] right-[50%] translate-x-[50%] z-0">
                        <FamilyCMSThumbnail thumbnail={thumbnail} />
                    </div>

                    <div className="w-full z-[99999] absolute top-[60px] right-[50%] translate-x-[50%] flex items-center justify-center">
                        <div className="bg-white flex flex-col items-center justify-center z-9999 relative">
                            {emoji?.unified && showEmoji && (
                                <div className="bg-white rounded-full h-[40px] w-[40px] absolute top-[-20px] right-[50%] translate-x-[50%] flex items-center justify-center shadow-soft-top">
                                    <span className="mb-2">
                                        <EmojiRenderer data={emoji} size={20} />
                                    </span>
                                </div>
                            )}
                            <p className="text-grayscale-900 px-4 py-1 text-xl z-9999 shadow-soft-bottom min-w-[100px] min-h-[36px] text-center">
                                {_familyName}
                                <CrescentCornerLeft className="absolute bottom-[-20px] left-[0] z-0" />
                                <CrescentCornerRight className="absolute bottom-[-20px] right-[0] z-0" />
                            </p>
                        </div>
                    </div>

                    <div className="w-full mt-[120px] flex items-center justify-center">
                        {familyMotto && (
                            <p
                                className={`text-center  px-[16px] text-[17px] font-poppins font-normal mt-4 text-grayscale-900 ${
                                    showFullMotto ? '' : 'line-clamp-2'
                                }`}
                            >
                                {familyMotto}
                            </p>
                        )}
                    </div>
                </div>

                {children}

                {showSleeve && (
                    <div
                        className={`w-full flex items-center justify-center relative ${
                            showQRCode ? '!pt-6' : 'pt-4'
                        }`}
                    >
                        <div className="w-full flex items-center justify-center relative mb-[-2.5px]">
                            <IDSleeve className="h-auto w-full" />
                        </div>
                        {showQRCode && (
                            <button
                                onClick={qrCodeOnClick}
                                className="absolute bg-white p-3 rounded-full mb-6 shadow-soft-bottom"
                            >
                                <QRCodeScanner className="h-[30px] text-grayscale-900" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FamilyCrest;
