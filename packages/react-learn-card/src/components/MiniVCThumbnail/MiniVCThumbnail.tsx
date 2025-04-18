import React from 'react';

import VerifiedCheck from '../../assets/images/verified-check.png';

import { MiniVCThumbnailProps } from './types';

export const MiniVCThumbnail: React.FC<MiniVCThumbnailProps> = ({
    title,
    createdAt,
    issuerImage,
    badgeImage,
    className = '',
    onClick = () => {},
}) => {
    const titleClasses = !issuerImage ? 'w-full text-center' : 'w-3/4 text-left';
    const createdAtClasses = !issuerImage ? 'w-full text-center' : 'text-left';

    return (
        <div
            onClick={onClick}
            className={`flex flex-col items-center justify-between relative py-3 px-3 rounded-3xl shadow-3xl bg-emerald-700 min-h-[120px] max-w-sm mini-vc-thumbnail-container ${className}`}
            data-testid="mini-vc-thumbnail"
        >
            <div className="flex flex-row items-center justify-between mb-3 z-10">
                {issuerImage && (
                    <div
                        className="flex flex-row justify-center items-center w-1/4 text-center"
                        data-testid="mini-vc-thumbnail-issuer"
                    >
                        <div className="min-w-[40px] min-h-[40px] max-h-[48px] max-w-[48px] shadow-3xl p-1 rounded-full bg-white">
                            <img
                                className="h-full w-full object-cover rounded-full"
                                src={issuerImage}
                                alt="issuer image"
                            />
                        </div>
                    </div>
                )}
                <div className={`flex flex-col items-start justify-center ${titleClasses}`}>
                    <h2
                        className="ml-2 text-sm tracking-wide leading-snug line-clamp-2"
                        data-testid="mini-vc-thumbnail-title"
                    >
                        {title ?? ''}
                    </h2>
                    <p
                        className={`ml-2 text-sm font-light line-clamp-1 ${createdAtClasses}`}
                        data-testid="mini-vc-thumbnail-createdAt"
                    >
                        {createdAt ?? ''}
                    </p>
                </div>
            </div>
            <div className="flex items-center justify-center w-full mt-3">
                {badgeImage && (
                    <div
                        className="flex item-center justify-center w-full -mt-3"
                        data-testid="mini-vc-thumbnail-badge"
                    >
                        <div className="max-h-[80px] max-w-[80px] xxsm:h-[60px] xxsm:w-[60px] border-solid border-1 border-black bg-white z-10">
                            <img
                                className="h-full w-full object-cover"
                                src={badgeImage}
                                alt="badge image"
                            />
                        </div>
                    </div>
                )}
                <div className="flex absolute bottom-1 right-1 items-center justify-center my-0 mx-1 h-10 w-10 rounded-full bg-white overflow-hidden">
                    <div className="flex items-center justify-center h-5/6 w-10/12 bg-white rounded-full border-solid border-4 border-emerald-700 overflow-hidden">
                        <img
                            className="h-full w-full object-cover"
                            src={VerifiedCheck ?? ''}
                            alt="credential icon"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MiniVCThumbnail;
