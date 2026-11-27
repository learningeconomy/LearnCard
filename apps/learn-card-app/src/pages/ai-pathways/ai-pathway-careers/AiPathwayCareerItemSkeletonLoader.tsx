import React from 'react';
import { AppSkeletonText } from '../../../components/feedback/AppSkeletonText';

export const AiPathwayCareerItemSkeleton: React.FC = () => {
    return (
        <div
            role="button"
            className="w-full flex flex-col items-start justify-start px-4 py-2 gap-1
                 border-solid border border-grayscale-200 rounded-xl"
        >
            <div className="w-full flex flex-col items-start justify-start gap-2">
                {/* Title row */}
                <div className="flex items-center justify-between w-full">
                    <AppSkeletonText animated className="w-[70%] h-[18px] rounded-sm" />
                    <AppSkeletonText animated className="w-[20px] h-[20px] rounded-sm" />
                </div>

                {/* Salary label */}
                <AppSkeletonText animated className="w-[140px] h-[12px] rounded-sm" />

                {/* Salary value */}
                <AppSkeletonText animated className="w-[100px] h-[14px] rounded-sm" />

                {/* Description (2 lines) */}
                <AppSkeletonText animated className="w-full h-[14px] rounded-sm" />
                <AppSkeletonText animated className="w-[85%] h-[14px] rounded-sm" />
            </div>
        </div>
    );
};

export default AiPathwayCareerItemSkeleton;
