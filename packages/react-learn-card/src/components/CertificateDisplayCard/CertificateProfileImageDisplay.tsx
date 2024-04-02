import React from 'react';
import IssuerSeal from '../svgs/IssuerSeal';

type CertificateProfileImageDisplayProps = {
    imageUrl: string;
    isIssuer?: boolean;
    className?: string;
};

const CertificateProfileImageDisplay: React.FC<CertificateProfileImageDisplayProps> = ({
    imageUrl,
    isIssuer = false,
    className = '',
}) => {
    return (
        <div className={className}>
            {isIssuer && (
                <div className="bg-white rounded-full p-[5px]">
                    <IssuerSeal />
                </div>
            )}

            <img
                className="h-[50px] w-[50px] rounded-full absolute border-[2px] border-solid border-grayscale-200"
                src={imageUrl}
            />
        </div>
    );
};

export default CertificateProfileImageDisplay;
