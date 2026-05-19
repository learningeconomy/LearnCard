import React from 'react';
import IssuerSeal from '../svgs/IssuerSeal';
import { UserProfilePicture } from '../UserProfilePicture';

type MeritBadgeProfileImageDisplayProps = {
    imageUrl?: string;
    imageComponent?: React.ReactNode;
    showSeal?: boolean;
    className?: string;
    size?: string;
    userName?: string;
    avatarColor?: string;
    avatarFingerprintColor?: string;
    avatarFallbackVariant?: 'initial' | 'fingerprint';
};

const MeritBadgeProfileImageDisplay: React.FC<MeritBadgeProfileImageDisplayProps> = ({
    imageUrl,
    showSeal = false,
    className = '',
    imageComponent,
    size = 'big',
    userName,
    avatarColor,
    avatarFingerprintColor,
    avatarFallbackVariant = 'initial',
}) => {
    const imageClassName = `${
        size === 'big' ? 'h-[60px] w-[60px]' : 'h-[39px] w-[39px]'
    } rounded-full overflow-hidden border-[2px] border-solid border-grayscale-200`;
    const silhouetteClassName = size === 'big' ? 'h-[43px] w-[43px]' : 'h-[28px] w-[28px]';

    const profileImage = imageComponent ? (
        <div className={imageClassName}>{imageComponent}</div>
    ) : (
        <UserProfilePicture
            customContainerClass={imageClassName}
            customImageClass="h-full w-full object-cover"
            user={{ image: imageUrl, name: userName }}
            avatarColor={avatarColor}
            avatarFingerprintColor={avatarFingerprintColor}
            avatarIconClassName={silhouetteClassName}
            avatarSilhouetteClassName={silhouetteClassName}
            avatarFallbackVariant={avatarFallbackVariant}
        />
    );

    return (
        <div className={className}>
            {showSeal && (
                <div className="relative inline-flex items-center justify-center">
                    <div className="bg-white rounded-full p-[5px]">
                        <IssuerSeal size="58" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        {profileImage}
                    </div>
                </div>
            )}

            {!showSeal && profileImage}
        </div>
    );
};

export default MeritBadgeProfileImageDisplay;
