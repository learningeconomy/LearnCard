import React from 'react';
import { IonSkeletonText } from '@ionic/react';

const AiSessionsHeaderSkeleton: React.FC = () => {
    return (
        <div className="px-[15px] py-[20px] bg-white safe-area-top-margin flex items-center gap-[10px] z-20 relative shadow-bottom-1-5 rounded-b-[20px] w-full">
            <div className="p-0 shrink-0" />

            <div className="h-[55px] w-[55px] min-h-[55px] min-w-[55px]">
                <IonSkeletonText
                    animated
                    style={{ width: '55px', height: '55px', borderRadius: '16px' }}
                />
            </div>

            <div className="flex flex-col items-start justify-center min-w-0 gap-[8px]">
                <IonSkeletonText
                    animated
                    style={{ width: '180px', height: '21px', borderRadius: '4px' }}
                />
                <IonSkeletonText
                    animated
                    style={{ width: '120px', height: '14px', borderRadius: '4px' }}
                />
            </div>
        </div>
    );
};

export default AiSessionsHeaderSkeleton;
