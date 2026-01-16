import React from 'react';
import { IonSkeletonText } from '@ionic/react';

export const AiPathwayCareerItemSkeleton: React.FC = () => {
    return (
        <div
            role="button"
            className="w-full flex flex-col items-start justify-start px-4 py-2 gap-1
                 border-solid border-[1px] border-grayscale-200 rounded-xl"
        >
            <div className="w-full flex flex-col items-start justify-start gap-2">
                {/* Title row */}
                <div className="flex items-center justify-between w-full">
                    <IonSkeletonText animated className="w-[70%] h-[18px] rounded" />
                    <IonSkeletonText animated className="w-[20px] h-[20px] rounded" />
                </div>

                {/* Salary label */}
                <IonSkeletonText animated className="w-[140px] h-[12px] rounded" />

                {/* Salary value */}
                <IonSkeletonText animated className="w-[100px] h-[14px] rounded" />

                {/* Description (2 lines) */}
                <IonSkeletonText animated className="w-full h-[14px] rounded" />
                <IonSkeletonText animated className="w-[85%] h-[14px] rounded" />
            </div>
        </div>
    );
};

export default AiPathwayCareerItemSkeleton;
