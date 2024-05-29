import React from 'react';
import CertificateRibbon from './CertificateRibbon';

type CertificateImageDisplayProps = {
    imageUrl: string;
    className?: string;
    ribbonColor?: string;
};

const CertificateImageDisplay: React.FC<CertificateImageDisplayProps> = ({
    imageUrl,
    className = '',
    ribbonColor = 'amber-500',
}) => {
    return (
        <div
            className={`flex items-center justify-center w-[120px] h-[120px] rounded-full border-white border-solid border-4 bg-white z-50 ${className}`}
        >
            <div className="relative w-[75%] h-[75%] flex items-center justify-center rounded-full border-white border-solid border-4 overflow-hidden object-contain">
                <img src={imageUrl} alt="certificate thumbnail" />
            </div>

            <CertificateRibbon className={`absolute z-[9999] ${ribbonColor} w-[120px] h-[120px]`} />
        </div>
    );
};

export default CertificateImageDisplay;
