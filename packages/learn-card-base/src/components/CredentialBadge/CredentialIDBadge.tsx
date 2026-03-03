import React from 'react';

import { VC } from '@learncard/types';

import IDSleeve from 'learn-card-base/svgs/IDSleeve';
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

    backgroundStyles.boxShadow = '0px 4px 4px 0px rgba(0, 0, 0, 0.25)';

    return (
        <div
            style={backgroundStyles}
            className="w-full relative flex-col rounded-tr-[10px] rounded-tl-[10px]  pl-4 pt-6 bg-cover bg-center bg-no-repeat"
        >
            <ProfilePicture
                customContainerClass="flex justify-center items-center h-[60px] w-[60px] rounded-full overflow-hidden  text-white font-medium text-4xl min-w-[60px] min-h-[60px] absolute top-[-15px] left-[-5px]"
                customImageClass="flex justify-center items-center h-[60px] w-[60px] rounded-full overflow-hidden object-cover  min-w-[60px] min-h-[60px]"
                customSize={500}
            />
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
        <div
            className={`relative w-full mt-8 mb-8 select-none ${
                badgeContainerCustomClass ?? ''
            } bg-blue-500`}
        >
            {/* 1) Background card at z-0 (behind sleeve) */}
            <div className="relative w-full z-0 px-2 pt-5">
                <IDDisplayCard credential={credential} backgroundColor={backgroundColor} />
            </div>

            {/* 2) Sleeve overlay at z-10 */}
            <div className="absolute bottom-[-20%] left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
                <IDSleeve className="w-[320px] h-[75px] text-white" version="2" />
            </div>

            {/* 3) ID icon bubble at z-20 */}
            <div className="absolute bottom-[-20px] left-1/2 transform -translate-x-1/2 z-20">
                <div className="w-[40px] h-[40px] rounded-full bg-white flex items-center justify-center">
                    <IDsIconSolid className="w-[20px] h-[20px] text-gray-500" />
                </div>
            </div>
        </div>
    );
};

export default CredentialIDBadge;
