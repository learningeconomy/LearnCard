import React from 'react';

import { IonSkeletonText } from '@ionic/react';

export const AiSessionTopicItemSkeleton: React.FC = () => {
    return (
        <div className="flex items-center justify-between w-full bg-white pb-[12px] pt-[12px] cursor-default first:mt-1 last:pb-[200px]">
            <div className="flex items-center justify-start">
                <div className="w-[45px] h-[45px] flex items-center justify-center mr-1">
                    <IonSkeletonText
                        animated
                        style={{ width: '45px', height: '45px', borderRadius: '12px' }}
                    />
                </div>

                <div className="ml-2">
                    <IonSkeletonText
                        animated
                        style={{ width: '140px', height: '18px', borderRadius: '4px' }}
                    />
                </div>
            </div>

            <div className="flex items-center space-x-2 mr-2">
                <IonSkeletonText
                    animated
                    style={{ width: '20px', height: '16px', borderRadius: '4px' }}
                />
                <IonSkeletonText
                    animated
                    style={{ width: '20px', height: '20px', borderRadius: '4px' }}
                />
            </div>
        </div>
    );
};

export default AiSessionTopicItemSkeleton;
