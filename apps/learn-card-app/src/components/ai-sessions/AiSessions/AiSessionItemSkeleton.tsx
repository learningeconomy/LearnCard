import React from 'react';
import { IonSkeletonText } from '@ionic/react';

const AiSessionItemSkeleton: React.FC = () => {
    return (
        <div className="flex items-center justify-between w-full bg-white pb-[12px] pt-[12px] cursor-default first:mt-1 last:pb-[200px]">
            <div className="flex items-center justify-start">
                <div className="ml-2">
                    <IonSkeletonText
                        animated
                        style={{ width: '180px', height: '18px', borderRadius: '4px' }}
                    />
                </div>
            </div>

            <div className="flex items-center justify-end space-x-2 mr-2">
                <IonSkeletonText
                    animated
                    style={{ width: '16px', height: '16px', borderRadius: '50%' }}
                />
                <IonSkeletonText
                    animated
                    style={{ width: '20px', height: '20px', borderRadius: '4px' }}
                />
            </div>
        </div>
    );
};

export default AiSessionItemSkeleton;
