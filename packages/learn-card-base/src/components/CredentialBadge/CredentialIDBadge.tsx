import React from 'react';

import { VC } from '@learncard/types';

import { IDsIconSolid } from 'learn-card-base/svgs/wallet/IDsIcon';
import { useGetVCInfo } from 'learn-card-base/hooks/useGetVCInfo';
import ProfilePicture from '../profilePicture/ProfilePicture';
import defaultIDCardImage from 'learn-card-base/assets/images/default-id-bg-gradient.png';

// Full-width background card
export const IDDisplayCard: React.FC<{ credential: VC; backgroundColor?: string }> = ({
    credential,
    backgroundColor,
}) => {
    const {
        idDisplayBackgroundImage,
        idDisplayDimBackgroundImage,
        backgroundColor: vcBackgroundColor,
    } = useGetVCInfo(credential);

    const backgroundStyles: React.CSSProperties = {};

    if (idDisplayBackgroundImage) {
        backgroundStyles.backgroundImage = `url(${idDisplayBackgroundImage})`;
        if (idDisplayDimBackgroundImage) {
            backgroundStyles.backgroundImage = `linear-gradient(to bottom, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.75)), url(${idDisplayBackgroundImage})`;
        }
    } else if (backgroundColor || vcBackgroundColor) {
        backgroundStyles.background = backgroundColor ?? vcBackgroundColor;
    } else {
        backgroundStyles.backgroundImage = `url(${defaultIDCardImage})`;
    }

    return (
        <div className="w-full aspect-[335/180] relative">
            {/* Header Image with generous rounding and hairline border */}
            <div
                style={backgroundStyles}
                className="absolute inset-0 rounded-t-[16px] bg-cover bg-center bg-no-repeat overflow-hidden border border-white/30"
            >
                {/* Subtle frosted scrim at the bottom edge for depth to seat the photo/notch */}
                <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-black/40 via-black/5 to-transparent pointer-events-none" />
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
            {/* bg-blue-500 frames the header image on top.
                Removed px-2 so the header image and glass shelf span the full width,
                eliminating any awkward blue side-slivers. */}
            <div className="relative w-full z-0 pb-0 bg-blue-500 rounded-t-[20px] overflow-hidden">
                {/* 1) Background card at z-0 */}
                <div className="relative w-full">
                    <IDDisplayCard credential={credential} backgroundColor={backgroundColor} />
                </div>

                {/* 2) Frosted glass shelf spanning full width.
                       It blurs the bottom of the header image, transitioning smoothly into the white card body below. */}
                <div className="absolute bottom-0 left-0 w-full h-[36px]">
                    <div
                        className="w-full h-full bg-white/70 backdrop-blur-md border-t border-white/50 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]"
                        style={{
                            // Scalloped notch cut into the glass shelf for the ID icon bubble
                            // Center follows the bubble and drops slightly with the lower placement.
                            maskImage:
                                'radial-gradient(circle 24px at calc(100% - 38px) 8px, transparent 100%, black 100%)',
                            WebkitMaskImage:
                                'radial-gradient(circle 24px at calc(100% - 38px) 8px, transparent 100%, black 100%)',
                        }}
                    />
                    {/* Gradient to solid white to blend perfectly into the card body below */}
                    <div className="absolute bottom-0 left-0 w-full h-[16px] bg-gradient-to-b from-white/0 to-white pointer-events-none" />
                </div>

                {/* 3) Prominent circular profile photo straddling the header/glass boundary */}
                <div className="absolute bottom-[28px] left-[24px] transform translate-y-1/2 z-20">
                    <ProfilePicture
                        customContainerClass="flex justify-center items-center h-[64px] w-[64px] rounded-full overflow-hidden text-white font-medium text-3xl bg-grayscale-100 border-[4px] border-white shadow-sm"
                        customImageClass="flex justify-center items-center h-full w-full rounded-full overflow-hidden object-cover"
                        customSize={500}
                    />
                </div>

                {/* 4) Frosted-glass ID icon bubble nested into the scalloped notch */}
                <div className="absolute bottom-[28px] right-[20px] transform translate-y-1/2 z-20">
                    <div className="w-[36px] h-[36px] rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/60">
                        <IDsIconSolid className="w-[18px] h-[18px] text-grayscale-800" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CredentialIDBadge;
