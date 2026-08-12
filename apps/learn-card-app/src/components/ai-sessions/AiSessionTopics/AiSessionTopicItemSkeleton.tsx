import React from 'react';

import { IonSkeletonText } from '@ionic/react';

export const AiSessionTopicItemSkeleton: React.FC = () => {
    return (
        <div className="flex items-center justify-between w-full bg-white rounded-2xl px-4 py-3 mb-3 cursor-default">
            <div className="flex items-center justify-start flex-1 min-w-0">
                <IonSkeletonText
                    animated
                    style={{ width: '50px', height: '50px', borderRadius: '12px', flexShrink: 0 }}
                />
                <div className="ml-3 flex flex-col gap-1">
                    <IonSkeletonText
                        animated
                        style={{ width: '130px', height: '17px', borderRadius: '4px' }}
                    />
                    <IonSkeletonText
                        animated
                        style={{ width: '80px', height: '13px', borderRadius: '4px' }}
                    />
                </div>
            </div>

            <div className="flex items-center gap-1 ml-3">
                <IonSkeletonText
                    animated
                    style={{ width: '20px', height: '16px', borderRadius: '4px' }}
                />
                <IonSkeletonText
                    animated
                    style={{ width: '16px', height: '16px', borderRadius: '4px' }}
                />
            </div>
        </div>
    );
};

export default AiSessionTopicItemSkeleton;
