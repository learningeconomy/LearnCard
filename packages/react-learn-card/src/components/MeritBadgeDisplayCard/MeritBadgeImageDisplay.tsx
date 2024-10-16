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
            <MeritBadgeRibbon className="absolute z-[1]" image={imageUrl} />
        </div>
    );
};

export default MeritBadgeImageDisplay;
