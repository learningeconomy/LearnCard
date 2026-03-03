import React from 'react';
import { IonAvatar, IonSkeletonText } from '@ionic/react';

export const EndorsementRequestModalSkeletonLoader: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center bg-white w-full max-w-[375px] rounded-[20px] pt-4 relative">
            <div className="w-full flex flex-col items-center justify-center gap-3 pt-[50px]">
                <IonAvatar style={{ width: 60, height: 60 }}>
                    <IonSkeletonText animated style={{ width: '100%', height: '100%' }} />
                </IonAvatar>

                <div className="w-full flex flex-col items-center justify-center pb-4 px-[12px] gap-2">
                    <IonSkeletonText
                        animated
                        style={{ width: '75%', height: 16, borderRadius: 4 }}
                    />
                    <IonSkeletonText
                        animated
                        style={{ width: '50%', height: 14, borderRadius: 4 }}
                    />
                </div>
            </div>

            <div className="w-full px-2 pb-2 flex items-center justify-center">
                <IonSkeletonText
                    animated
                    style={{ width: '100%', height: 120, borderRadius: 20 }}
                />
            </div>
        </div>
    );
};

export default EndorsementRequestModalSkeletonLoader;
