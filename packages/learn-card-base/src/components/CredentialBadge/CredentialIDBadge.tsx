import React from 'react';

import { VC } from '@learncard/types';

import { IDsIconSolid } from 'learn-card-base/svgs/wallet/IDsIcon';
import ProfilePicture from '../profilePicture/ProfilePicture';
import defaultIDCardImage from 'learn-card-base/assets/images/default-id-bg-gradient.png';

// Full-width background card
export const IDDisplayCard: React.FC<{ credential: VC; backgroundColor?: string }> = ({
    credential,
    backgroundColor,
}) => {
    let backgroundStyles: React.CSSProperties = {};
    const backgroundImage = credential?.boostID?.backgroundImage;
    const dimBackgroundImage = credential?.boostID?.dimBackgroundImage;

    if (backgroundImage) {
        backgroundStyles.backgroundImage = `url(${backgroundImage})`;
        if (dimBackgroundImage) {
            backgroundStyles.backgroundImage = `linear-gradient(to bottom, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.75)), url(${backgroundImage})`;
        }
    } else if (backgroundColor) {
        backgroundStyles.background = backgroundColor;
    } else {
        backgroundStyles.backgroundImage = `url(${defaultIDCardImage})`;
    }

    // Create a true transparent cutout at the bottom center for the icon bubble to nest into
    // 26px radius creates a 52px diameter hole, perfect for a 40px bubble with a 6px gap
    backgroundStyles.WebkitMaskImage =
        'radial-gradient(circle at 50% 100%, transparent 26px, black 26.5px)';
    backgroundStyles.maskImage =
        'radial-gradient(circle at 50% 100%, transparent 26px, black 26.5px)';

    return (
        <div
            className="w-full aspect-[335/180] relative"
            style={{ filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.08))' }}
        >
            <div
                style={backgroundStyles}
                className="w-full h-full relative flex-col rounded-[20px] pl-4 pt-6 bg-cover bg-center bg-no-repeat"
            >
                <ProfilePicture
                    customContainerClass="flex justify-center items-center h-[60px] w-[60px] rounded-full overflow-hidden text-white font-medium text-4xl min-w-[60px] min-h-[60px] absolute top-[-15px] left-[-5px]"
                    customImageClass="flex justify-center items-center h-[60px] w-[60px] rounded-full overflow-hidden object-cover min-w-[60px] min-h-[60px]"
                    customSize={500}
                />
            </div>
        </div>
    );
};

// Composite badge with layering
export const CredentialIDBadge: React.FC<{
    credential: VC;
    backgroundColor?: string;
    badgeContainerCustomClass?: string;
}> = ({ credential, backgroundColor, badgeContainerCustomClass }) => {
    return (
        <div className={`relative w-full mt-8 mb-8 select-none ${badgeContainerCustomClass ?? ''}`}>
            <div className="relative w-full z-0 px-2 pt-5 pb-5">
                {/* 1) Background card at z-0 */}
                <IDDisplayCard credential={credential} backgroundColor={backgroundColor} />

                {/* 2) ID icon bubble at z-20, nested perfectly into the mask cutout */}
                {/* The container has pb-5 (20px). The card ends at bottom: 20px. */}
                {/* To center a 40px bubble on the bottom edge, its center should be at 20px. */}
                {/* So its bottom should be at 20px - 20px = 0px. */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="w-[40px] h-[40px] rounded-full bg-white flex items-center justify-center shadow-sm border border-grayscale-100">
                        <IDsIconSolid className="w-[20px] h-[20px] text-grayscale-500" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CredentialIDBadge;
