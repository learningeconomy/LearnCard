import React from 'react';
import IssuerSeal from '../svgs/IssuerSeal';
import UserProfilePicture from '../UserProfilePicture/UserProfilePicture';

type CertificateProfileImageDisplayProps = {
    imageUrl?: string;
    imageComponent?: React.ReactNode;
    isIssuer?: boolean;
    className?: string;
    userName?: string;
    avatarColor?: string;
    avatarFingerprintColor?: string;
    avatarFallbackVariant?: 'initial' | 'fingerprint';
};

const CertificateProfileImageDisplay: React.FC<CertificateProfileImageDisplayProps> = ({
    imageUrl,
    isIssuer = false,
    className = '',
    imageComponent,
    userName,
    avatarColor,
    avatarFingerprintColor,
    avatarFallbackVariant = 'initial',
}) => {
    const imageClassName =
        'h-[50px] w-[50px] rounded-full overflow-hidden border-[2px] border-solid border-grayscale-200';
    const fingerprintClassName = isIssuer ? 'h-[38px] w-[38px]' : 'h-[36px] w-[36px]';
    const silhouetteClassName = 'h-[38px] w-[38px]';

    const profileImage = imageComponent ? (
        <div className={imageClassName}>{imageComponent}</div>
    ) : (
        <UserProfilePicture
            customContainerClass={imageClassName}
            customImageClass="h-full w-full object-cover leading-normal"
            user={{ image: imageUrl, name: userName }}
            avatarColor={avatarColor}
            avatarFingerprintColor={avatarFingerprintColor}
            avatarIconClassName={fingerprintClassName}
            avatarSilhouetteClassName={silhouetteClassName}
            avatarFallbackVariant={avatarFallbackVariant}
        />
    );

    return (
        <div className={className}>
            {isIssuer && (
                <div className="relative inline-flex items-center justify-center">
                    <div className="bg-white rounded-full p-[5px]">
                        <IssuerSeal />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        {profileImage}
                    </div>
                </div>
            )}

            {!isIssuer && profileImage}
        </div>
    );
};

export default CertificateProfileImageDisplay;
