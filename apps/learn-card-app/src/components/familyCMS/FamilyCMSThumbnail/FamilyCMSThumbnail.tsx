import React from 'react';

import ShieldMask from 'learn-card-base/svgs/ShieldMask';

export const FamilyCMSThumbnail: React.FC<{ thumbnail: string; className?: string }> = ({
    thumbnail,
    className,
}) => {
    return (
        <div className="w-full flex items-center justify-center mt-4 mb-4">
            <ShieldMask className={className} imageUrl={thumbnail} />
        </div>
    );
};

export default FamilyCMSThumbnail;
