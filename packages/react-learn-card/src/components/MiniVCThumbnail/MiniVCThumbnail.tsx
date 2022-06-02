import React from 'react';

import VerifiedCheck from '../../assets/images/verified-check.png';

import { MiniVCThumbnailProps } from './types';

import './ MiniVCThumbnail.css';

export const MiniVCThumbnail: React.FC<MiniVCThumbnailProps> = ({
    title,
    createdAt,
    issuerImage,
    badgeImage,
    className = '',
    onClick = () => {},
}) => {
    return (
        <div
            onClick={onClick}
            className={`flex flex-col items-center justify-between relative py-3 px-3 rounded-3xl shadow-3xl bg-emerald-700 max-w-sm mini-vc-thumbnail-container ${className}`}
        >
            <div className="flex flex-row items-center justify-between mb-3 z-10">
                <div className="flex flex-row justify-center items-center w-1/4 text-center">
                    <div className="min-w-[48px] min-h-[48px] border-solid border-2 border-black bg-white">
                        <img
                            className="h-full w-full object-cover"
                            src={issuerImage}
                            alt="issuer image"
                        />
                    </div>
                </div>
                <div className="flex flex-col items-start justify-center w-3/4 text-left">
                    <h2
                        className="ml-2 text-sm tracking-wide leading-snug text-left line-clamp-2"
                        data-testid="vc-thumbnail-title"
                    >
                        {title ?? ''}
                    </h2>
                    <p
                        className="ml-2 text-sm font-light text-center line-clamp-1"
                        data-testid="vc-thumbnail-createdAt"
                    >
                        {createdAt ?? ''}
                    </p>
                </div>
            </div>
            <div className="flex items-center justify-center w-full mt-3">
                <div className="flex item-center justify-center w-full -mt-3">
                    <div className="h-20 w-20 border-solid border-2 border-black bg-white z-10">
                        <img
                            className="h-full w-full object-cover"
                            src={badgeImage}
                            alt="badge image"
                        />
                    </div>
                </div>
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
