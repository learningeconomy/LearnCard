import React from 'react';
import { IonSkeletonText } from '@ionic/react';

export const AiPathwayContentListItemSkeleton: React.FC = () => {
    const mediaHeight = 'min-h-[80px] max-h-[80px]';

    return (
        <div
            role="button"
            className={`flex bg-grayscale-100 rounded-[20px] relative ${mediaHeight} w-full`}
        >
            {/* Thumbnail skeleton */}
            <div
                className="w-[80px] relative overflow-hidden rounded-[20px] shadow-3xl
                            min-h-[80px] max-h-[80px] flex-shrink-0"
            >
                <IonSkeletonText animated className="w-full h-full" />
            </div>

            {/* Text content skeleton */}
            <div
                className="flex flex-1 py-4 pl-4 rounded-r-[20px]
                           flex-col justify-between z-10 mr-[30px]"
            >
                {/* Title */}
                <IonSkeletonText animated className="w-[85%] h-[14px] rounded" />

                {/* Source */}
                <IonSkeletonText animated className="w-[40%] h-[12px] rounded" />
            </div>
        </div>
    );
};

export default AiPathwayContentListItemSkeleton;
