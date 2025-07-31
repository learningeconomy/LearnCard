import React from 'react';
import IssuerSeal from '../svgs/IssuerSeal';
import UserProfilePicture from '../UserProfilePicture/UserProfilePicture';

type CertificateProfileImageDisplayProps = {
    imageUrl?: string;
    imageComponent?: React.ReactNode;
    isIssuer?: boolean;
    className?: string;
    userName?: string;
};

const CertificateProfileImageDisplay: React.FC<CertificateProfileImageDisplayProps> = ({
    imageUrl,
    isIssuer = false,
    className = '',
    imageComponent,
    userName,
}) => {
    const imageClassName = `h-[50px] w-[50px] rounded-full overflow-hidden ${
        isIssuer ? '!absolute border-[2px] border-solid border-grayscale-200' : ''
    }`;

    return (
        <div className={className}>
            {isIssuer && (
                <div className="bg-white rounded-full p-[5px]">
                    <IssuerSeal />
                </div>
            )}

            {imageComponent && <div className={imageClassName}>{imageComponent}</div>}
            {!imageComponent && (
                <UserProfilePicture
                    customContainerClass={`${imageClassName} ${!imageUrl ? 'pt-[6px]' : ''}`}
                    customImageClass="h-full w-full object-cover"
                    user={{ image: imageUrl, name: userName }}
                />
            )}
        </div>
    );
};

export default CertificateProfileImageDisplay;
