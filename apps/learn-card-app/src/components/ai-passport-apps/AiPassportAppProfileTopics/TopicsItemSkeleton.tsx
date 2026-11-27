import React from 'react';
import { AppSkeletonText } from '../../feedback/AppSkeletonText';

export const TopicsItemSkeleton: React.FC = () => {
    return (
        <div className="w-full flex bg-white pb-[12px] pt-[12px]">
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                    <AppSkeletonText
                        animated
                        style={{ width: '120px', height: '20px', borderRadius: '4px' }}
                    />
                </div>

                <div className="flex items-center space-x-v3-2">
                    <AppSkeletonText
                        animated
                        style={{ width: '24px', height: '16px', borderRadius: '4px' }}
                    />
                    <AppSkeletonText
                        animated
                        style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default TopicsItemSkeleton;
