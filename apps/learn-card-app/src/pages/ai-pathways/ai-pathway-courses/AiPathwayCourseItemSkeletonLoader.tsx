import React from 'react';

import { IonSkeletonText } from '@ionic/react';

const AiPathwayCourseItemSkeletonLoader: React.FC = () => {
    return (
        <div
            className="w-full flex flex-col items-start justify-start px-4 py-2 gap-2
                 border-solid border-[1px] border-grayscale-200 rounded-xl"
        >
            {/* Occupation tags */}
            <IonSkeletonText animated className="w-24 h-3 rounded" />

            {/* Title */}
            <div className="w-full flex items-center justify-between">
                <IonSkeletonText animated className="w-[80%] h-5 rounded" />
            </div>

            {/* Institution */}
            <IonSkeletonText animated className="w-48 h-4 rounded" />

            {/* Logo area */}
            <div className="w-full flex justify-end items-center mt-1">
                <IonSkeletonText animated className="w-12 h-12 rounded" />
            </div>
        </div>
    );
};

export default AiPathwayCourseItemSkeletonLoader;
