import React from 'react';

import FatArrow from '../../assets/images/icon.green.fat-arrow.png';
import VerifiedCheck from '../../assets/images/verified-check.png';

import './VCThumbnail.css';

export type VCThumbnailProps = {
    /**
     * thumbnail title
     * @type {string}
     */
    title?: string;
    /**
     * issue date
     * @type {string}
     */
    createdAt?: string;
    /**
     * issuer image
     * @type {string}
     */
    issuerImage?: string;
    /**
     * user image
     * @type {string}
     */
    userImage?: string;
    /**
     * custom className
     * @type {string}
     */
    className?: string;
    /**
     * condensed or full view
     * of the thumbnail - defaulted to false
     * @type {boolean}
     */
    listView?: boolean;
    /**
     *
     * @type {function}
     */
    onClick?: () => void;
};

export const VCThumbnail: React.FC<VCThumbnailProps> = ({
    title,
    createdAt,
    issuerImage,
    userImage,
    className = '',
    listView = false,
    onClick = () => {},
}) => {
    if (listView) {
        return (
            <div
                onClick={onClick}
                className={`flex flex-col items-center justify-between relative py-3 px-3 rounded-3xl shadow-3xl bg-emerald-700 max-w-sm vc-thumbnail-listview-container ${className}`}
            >
                <div className="flex flex-row items-center justify-between mb-3 z-10">
                    <div className="flex flex-row justify-center items-center w-1/4 text-center">
                        <div className="h-16 w-16 border-solid border-2 border-black bg-white">
                            <img
                                className="h-full w-full object-cover"
                                src={issuerImage}
                                alt="issuer image"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col items-start justify-center w-3/4 text-left">
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

    return (
        <div
            onClick={onClick}
            className={`relative py-3 rounded-3xl shadow-3xl bg-emerald-700 vc-thumbnail-container ${className}`}
        >
            <div className="h-full w-full absolute">
                <div className="flex flex-col items-center justify-center z-10 text-center w-full">
                    <div className="flex flex-row items-start justify-between w-full">
                        <div className="flex flex-row items-start justify-start w-4/5 ml-3">
                            <h2
                                className="text-base tracking-wide leading-snug text-left line-clamp-2"
                                data-testid="vc-thumbnail-title"
                            >
                                {title ?? ''}
                            </h2>
                        </div>
                        <div className="flex flex-row items-start justify-end w-1/5 mr-3">
                            <div className="flex items-center justify-end h-8 w-8 rounded-full bg-white overflow-hidden">
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
                    <div className="w-full mt-2">
                        <p
                            className="text-sm font-light text-center line-clamp-1"
                            data-testid="vc-thumbnail-createdAt"
                        >
                            {createdAt ?? ''}
                        </p>
                    </div>

                    <div className="flex flex-row items-center justify-center mt-3 w-full">
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

                <div className="flex items-center justify-center w-full mt-4">
                    <div className="border-solid border-2 border-black bg-white relative w-1/4 h-0 overflow-hidden pt-25pct pb-0 px-0">
                        <img
                            className="h-full w-full object-cover absolute top-0 left-0"
                            src={issuerImage}
                            alt="main image"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VCThumbnail;
