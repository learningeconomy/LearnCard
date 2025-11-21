import React from 'react';
import { IonSkeletonText } from '@ionic/react';

const AiSessionsHeaderSkeleton: React.FC = () => {
    return (
        <div className="flex items-center justify-center ion-padding absolute bg-white/70 backdrop-blur-[5px] w-full top-0 left-0 z-20">
            <div className="w-full flex max-w-[600px]">
                <div className="p-0 mr-[10px]" />

                <div className="h-[75px] w-[75px] mr-2">
                    <IonSkeletonText
                        animated
                        style={{ width: '75px', height: '75px', borderRadius: '16px' }}
                    />
                </div>

                <div className="flex flex-col items-start justify-center ml-1 w-[calc(100%-100px)]">
                    <IonSkeletonText
                        animated
                        style={{
                            width: '200px',
                            height: '25px',
                            borderRadius: '4px',
                            marginBottom: '8px',
                        }}
                    />
                    <IonSkeletonText
                        animated
                        style={{ width: '150px', height: '17px', borderRadius: '4px' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default AiSessionsHeaderSkeleton;
