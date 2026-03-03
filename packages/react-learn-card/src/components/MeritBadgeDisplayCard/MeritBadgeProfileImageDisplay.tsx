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
};

const MeritBadgeProfileImageDisplay: React.FC<MeritBadgeProfileImageDisplayProps> = ({
    imageUrl,
    showSeal = false,
    className = '',
    imageComponent,
    size = 'big',
    userName,
}) => {
    const imageClassName = `${
        size === 'big' ? 'h-[60px] w-[60px]' : 'h-[39px] w-[39px]'
    } rounded-full overflow-hidden ${
        showSeal ? 'absolute border-[2px] border-solid border-grayscale-200' : ''
    }`;

    return (
        <div className={className}>
            {showSeal && (
                <div className="bg-white rounded-full p-[5px]">
                    <IssuerSeal size="58" />
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

export default MeritBadgeProfileImageDisplay;
