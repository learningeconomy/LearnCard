import React from 'react';

import FatArrow from '../../assets/images/icon.green.fat-arrow.png';
import VerifiedCheck from '../../assets/images/verified-check.png';

import './VCThumbnail.css';

export type VCThumbnailProps = {
    title?: string;
    createdAt?: string;
    issuerImage?: string;
    userImage?: string;
    className?: string;
    onClick?: () => void;
};

export const VCThumbnail: React.FC<VCThumbnailProps> = ({
    title,
    createdAt,
    issuerImage,
    userImage,
    className = '',
    onClick = () => {},
}) => {
    return (
        <div
            onClick={onClick}
            className={`flex flex-col items-center justify-between relative w-60 h-60 py-3 px-3 rounded-3xl shadow-3xl bg-emerald-700 vc-thumbnail-container ${className}`}
        >
            <div className="flex flex-col items-center justify-center z-10 text-center w-full">
                <div className="flex flex-row items-start justify-between w-full">
                    <div className="flex flex-row items-start justify-start w-4/5">
                        <h2
                            className="text-base tracking-wide leading-snug text-left"
                            data-testid="vc-thumbnail-title"
                        >
                            {title ?? ''}
                        </h2>
                    </div>
                    <div className="flex flex-row items-start justify-end w-1/5">
                        <div className="flex items-center justify-end my-0 h-8 w-8 rounded-full bg-white overflow-hidden">
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
                        className="text-sm font-light text-center"
                        data-testid="vc-thumbnail-createdAt"
                    >
                        {createdAt ?? ''}
                    </p>
                </div>

                <div className="flex flex-row items-center justify-center mt-2 w-full">
                    <div className="flex items-center justify-center h-14 w-14 shadow-3xl rounded-full overflow-hidden bg-white">
                        <div className="flex flex-row items-center justify-center rounded-full overflow-hidden bg-white w-10/12 h-5/6">
                            <img
                                className="w-8/12 h-4/6 object-cover"
                                src={issuerImage}
                                alt="issuer image"
                            />
                        </div>
                    </div>
                    <img className="h-8 w-8 my-0 mx-4" src={FatArrow ?? ''} alt="fat arrow icon" />
                    <div className="flex items-center justify-center h-14 w-14 shadow-3xl rounded-full overflow-hidden bg-white">
                        <div className="flex flex-row items-center justify-center h-full w-full rounded-full border-solid border-4 border-white overflow-hidden bg-white">
                            <img
                                className="h-full w-full object-cover"
                                src={userImage}
                                alt="user image"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-center w-full">
                <div className="h-16 w-16 border-solid border-2 border-black bg-white">
                    <img className="h-full w-full object-cover" src={issuerImage} alt="user image" />
                </div>
            </div>
        </div>
    );
};

export default VCThumbnail;
