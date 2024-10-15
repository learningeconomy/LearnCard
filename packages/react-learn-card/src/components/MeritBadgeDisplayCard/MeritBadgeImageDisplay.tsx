import React from 'react';
import MeritBadgeRibbon from './MeritBadgeRibbon';

type MeritBadgeImageDisplayProps = {
    imageUrl: string;
    className?: string;
};

const MeritBadgeImageDisplay: React.FC<MeritBadgeImageDisplayProps> = ({
    imageUrl,
    className = '',
}) => {
    return (
        <div
            className={`flex items-center justify-center w-[176px] h-[176px] rounded-full bg-white z-50 ${className}`}
        >
            <div className="relative left-[-0.5px] top-[-1.5px] w-full h-full p-[13px] flex items-center justify-center rounded-full overflow-hidden object-contain z-[2]">
                <img src={imageUrl} alt="merit badge thumbnail" />
            </div>
            <MeritBadgeRibbon className="absolute z-[1]" />
        </div>
    );
};

export default MeritBadgeImageDisplay;
