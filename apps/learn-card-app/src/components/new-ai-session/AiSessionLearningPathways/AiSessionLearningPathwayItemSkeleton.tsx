import React from 'react';
import { AppSkeletonText } from 'learn-card-base/ui/feedback/AppSkeletonText';

export const AiSessionLearningPathwayItemSkeleton: React.FC = () => {
    return (
        <div className="flex flex-col items-start justify-between bg-white h-full w-full ion-padding shadow-box-bottom rounded-[20px] cursor-default animate-pulse">
            <div className="w-full">
                <div className="mb-2">
                    <AppSkeletonText
                        animated
                        style={{ width: '70%', height: '20px', borderRadius: '4px' }}
                    />
                </div>

                <div className="space-y-v3-1 my-4">
                    <AppSkeletonText
                        animated
                        style={{ width: '100%', height: '14px', borderRadius: '4px' }}
                    />
                    <AppSkeletonText
                        animated
                        style={{ width: '95%', height: '14px', borderRadius: '4px' }}
                    />
                    <AppSkeletonText
                        animated
                        style={{ width: '85%', height: '14px', borderRadius: '4px' }}
                    />
                </div>
            </div>

            <div className="flex items-center bg-indigo-100 text-indigo-500 rounded-full text-xs py-1 px-2 min-h-[24px] w-[180px]">
                <AppSkeletonText
                    animated
                    style={{ width: '16px', height: '16px', borderRadius: '50%' }}
                />
                <div className="ml-2 space-x-v3-1 flex items-center">
                    <AppSkeletonText
                        animated
                        style={{ width: '42px', height: '12px', borderRadius: '4px' }}
                    />
                    <AppSkeletonText
                        animated
                        style={{ width: '50px', height: '12px', borderRadius: '4px' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default AiSessionLearningPathwayItemSkeleton;
