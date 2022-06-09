import React from 'react';

import FatArrow from '../../assets/images/icon.green.fat-arrow.png';
import VerifiedCheck from '../../assets/images/verified-check.png';

import { VCThumbnailProps } from './types';

export const VCThumbnail: React.FC<VCThumbnailProps> = ({
    title,
    createdAt,
    issuerImage,
    userImage,
    badgeImage,
    className = '',
    listView = false,
    onClick = () => {},
}) => {
    let imageElement: React.ReactNode | null = null;

    if (issuerImage) {
        imageElement = (
            <img className="h-full w-full object-cover" src={issuerImage} alt="issuer image" />
        );
    } else if (badgeImage) {
        imageElement = (
            <img className="h-full w-full object-cover" src={badgeImage} alt="badge image" />
        );
    }

    const titleClass =
        issuerImage || badgeImage
            ? 'items-start justify-center w-3/4 text-left'
            : 'item-center justify-center w-full text-center';

    if (listView) {
        return (
            <div
                onClick={onClick}
                className={`flex flex-col items-center justify-between relative py-3 px-3 rounded-3xl shadow-3xl bg-emerald-700 max-w-sm vc-thumbnail-listview-container ${className}`}
                data-testid="vc-thumbnail-list-view"
            >
                <div className="flex flex-row items-center justify-between mb-3 z-10">
                    {imageElement && (
                        <div
                            className="flex flex-row justify-center items-center w-1/4 text-center"
                            data-testid="vc-thumbnail-image"
                        >
                            <div className="h-16 w-16 border-solid border-2 border-black bg-white">
                                {imageElement}
                            </div>
                        </div>
                    )}

                    <div className={`flex flex-col  ${titleClass}`}>
                        <h2
                            className="ml-1 sm:ml-0 md:ml-0 lg:ml-0 text-base tracking-wide leading-snug text-left line-clamp-2"
                            data-testid="vc-thumbnail-title"
                        >
                            {title ?? ''}
                        </h2>
                        <p
                            className="ml-1 sm:ml-0 md:ml-0 lg:ml-0 text-sm font-light text-center line-clamp-1"
                            data-testid="vc-thumbnail-createdAt"
                        >
                            {createdAt ?? ''}
                        </p>
                    </div>
                </div>
                <div className="flex items-center justify-center w-full mt-3 vc-thumbnail-footer">
                    <h3 className="text-white text-sm text-right font-normal tracking-wide leading-tight flex-1">
                        Verified
                    </h3>
                    <div className="flex items-center justify-center my-0 mx-1 h-10 w-10 rounded-full bg-white overflow-hidden">
                        <div className="flex items-center justify-center h-5/6 w-10/12 bg-white rounded-full border-solid border-4 border-emerald-700 overflow-hidden">
                            <img
                                className="h-full w-full object-cover"
                                src={VerifiedCheck ?? ''}
                                alt="credential icon"
                            />
                        </div>
                    </div>
                    <h3 className="text-white text-sm text-left font-normal tracking-wide leading-tight flex-1">
                        Credential
                    </h3>
                </div>
            </div>
        );
    }

    const vcThumbNailAltContainerClass = !badgeImage ? 'vc-thumbnail-alt-container' : '';

    return (
        <div
            onClick={onClick}
            className={`relative py-3 xxsm:py-1 rounded-3xl shadow-3xl bg-emerald-700 vc-thumbnail-container ${vcThumbNailAltContainerClass} ${className}`}
            data-testid="vc-thumbnail"
        >
            <div className="h-full w-full absolute">
                <div className="flex flex-col items-center justify-center z-10 text-center w-full">
                    <div className="flex flex-row items-center justify-center w-full px-2">
                        <div className="flex flex-row items-center justify-center w-full">
                            <h2
                                className="text-base tracking-wide leading-snug text-center line-clamp-2"
                                data-testid="vc-thumbnail-title"
                            >
                                {title ?? ''}
                            </h2>
                        </div>
                    </div>
                    <div className="w-full mt-2">
                        <p
                            className="text-sm font-light text-center line-clamp-1"
                            data-testid="vc-thumbnail-createdAt"
                        >
                            {createdAt ?? ''}
                        </p>
                    </div>

                    <div className="flex flex-row items-center justify-center mt-3 xxsm:mt-1 w-full">
                        <div className="inline-block relative overflow-hidden rounded-full shadow-3xl h-0 bg-white w-1/4 pb-25pct">
                            <img
                                className="h-5/6 w-10/12 left-1 top-1 absolute rounded-full object-cover"
                                src={issuerImage}
                                alt="issuer image"
                            />
                        </div>

                        <img
                            className="h-8 w-8 my-0 mx-4"
                            src={FatArrow ?? ''}
                            alt="fat arrow icon"
                        />
                        <div className="inline-block relative overflow-hidden rounded-full shadow-3xl h-0 bg-white w-1/4 pb-25pct">
                            <img
                                className="w-full h-full absolute rounded-full object-cover border-solid border-4 border-white"
                                src={userImage}
                                alt="user image"
                            />
                        </div>
                    </div>
                </div>

                {badgeImage && (
                    <div className="flex items-center justify-center w-full mt-4 xxxsm:mt-0">
                        <div
                            className="border-solid border-2 border-black bg-white relative w-1/4 h-0 overflow-hidden pt-25pct pb-0 px-0"
                            data-testid="vc-thumbnail-badge"
                        >
                            <img
                                className="h-full w-full object-cover absolute top-0 left-0"
                                src={badgeImage}
                                alt="badge image"
                            />
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-center absolute right-2 bottom-5 xxsm:bottom-3 xxxsm:bottom-3 h-8 w-8 rounded-full bg-white overflow-hidden">
                    <div className="flex items-center justify-center h-5/6 w-10/12 bg-white rounded-full border-solid border-2 border-emerald-700 overflow-hidden">
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

export default VCThumbnail;
