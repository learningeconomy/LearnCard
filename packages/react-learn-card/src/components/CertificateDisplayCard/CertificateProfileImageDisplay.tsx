import React from 'react';
import IssuerSeal from '../svgs/IssuerSeal';

type CertificateProfileImageDisplayProps = {
    imageUrl?: string;
    imageComponent?: React.ReactNode;
    isIssuer?: boolean;
    className?: string;
};

const CertificateProfileImageDisplay: React.FC<CertificateProfileImageDisplayProps> = ({
    imageUrl,
    isIssuer = false,
    className = '',
    imageComponent,
}) => {
    const imageClassName = `h-[50px] w-[50px] rounded-full overflow-hidden ${isIssuer ? 'absolute border-[2px] border-solid border-grayscale-200' : ''
        }`;
    return (
        <div className={className}>
            {isIssuer && (
                <div className="bg-white rounded-full p-[5px]">
                    <IssuerSeal />
                </div>
            )}

            {imageComponent && <div className={imageClassName}>{imageComponent}</div>}
            {!imageComponent && <img className={imageClassName} src={imageUrl} />}
        </div>
    );
};

export default CertificateProfileImageDisplay;
