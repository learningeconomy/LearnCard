import React from 'react';
import { IonSkeletonText } from '@ionic/react';

export const TopicsItemSkeleton: React.FC = () => {
    return (
        <div className="w-full flex bg-white pb-[12px] pt-[12px]">
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                    <IonSkeletonText
                        animated
                        style={{ width: '120px', height: '20px', borderRadius: '4px' }}
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <IonSkeletonText
                        animated
                        style={{ width: '24px', height: '16px', borderRadius: '4px' }}
                    />
                    <IonSkeletonText
                        animated
                        style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default TopicsItemSkeleton;
