import React from 'react';
import { IonSkeletonText } from '@ionic/react';

export const RequestInsightsSkeletonLoader: React.FC = () => {
    return (
        <div className="h-full w-full flex items-center justify-center">
            <div className="w-full flex items-center justify-center px-4 max-w-[600px]">
                <div className="bg-white py-12 w-full flex flex-col items-center gap-4 justify-center shadow-box-bottom rounded-[24px]">
                    <div className="flex items-center gap-4">
                        <IonSkeletonText
                            animated
                            style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                            }}
                        />

                        <IonSkeletonText
                            animated
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                            }}
                        />

                        <IonSkeletonText
                            animated
                            style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                            }}
                        />
                    </div>

                    <IonSkeletonText
                        animated
                        style={{
                            width: '70%',
                            height: '22px',
                            borderRadius: '8px',
                        }}
                    />
                    <IonSkeletonText
                        animated
                        style={{
                            width: '50%',
                            height: '22px',
                            borderRadius: '8px',
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default RequestInsightsSkeletonLoader;
