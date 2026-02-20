import React from 'react';

import { IonSkeletonText } from '@ionic/react';

export const AiPathwaySessionItemSkeleton: React.FC = () => (
    <div className="w-full flex flex-col items-start justify-start px-4 py-2 gap-1 border-solid border-[1px] border-grayscale-200 rounded-xl">
        <div className="w-full">
            <div className="flex items-center justify-between w-full mb-4">
                <IonSkeletonText
                    animated
                    style={{ width: '60%', height: '24px', borderRadius: '4px' }}
                />
                <IonSkeletonText
                    animated
                    style={{ width: '24px', height: '24px', borderRadius: '4px' }}
                />
            </div>
            <div className="space-y-2 my-4">
                <IonSkeletonText
                    animated
                    style={{ width: '100%', height: '14px', borderRadius: '4px' }}
                />
                <IonSkeletonText
                    animated
                    style={{ width: '90%', height: '14px', borderRadius: '4px' }}
                />
                <IonSkeletonText
                    animated
                    style={{ width: '80%', height: '14px', borderRadius: '4px' }}
                />
            </div>
        </div>
        <div className="flex gap-2 w-full overflow-hidden">
            {[1, 2, 3].map(i => (
                <IonSkeletonText
                    key={i}
                    animated
                    style={{ width: '80px', height: '24px', borderRadius: '9999px' }}
                />
            ))}
        </div>
    </div>
);

export default AiPathwaySessionItemSkeleton;
