import React from 'react';

type TierIconProps = {
    icon: string;
};

// Default decorative emoji shown when a tier has no custom icon (iconography,
// not translatable copy — intentionally kept out of the Paraglide catalog).
const DEFAULT_TIER_ICON = '🗃️';

const TierIcon: React.FC<TierIconProps> = ({ icon }) => {
    return (
        <div className="bg-grayscale-900 p-[5px] rounded-full shrink-0 h-[50px] w-[50px] flex items-center justify-center">
            <span className="text-[30px] h-[40px] w-[40px] leading-[40px] font-fluentEmoji cursor-none pointer-events-none select-none">
                {icon || DEFAULT_TIER_ICON}
            </span>
        </div>
    );
};

export default TierIcon;
