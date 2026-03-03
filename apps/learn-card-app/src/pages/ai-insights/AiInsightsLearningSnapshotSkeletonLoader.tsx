import React from 'react';

import { IonSkeletonText } from '@ionic/react';

const AiInsightsLearningSnapshotsSkeletonLoader: React.FC = () => {
    return (
        <div className="flex flex-col items-start justify-start px-2 w-full bg-white shadow-bottom-2-4 p-[15px] rounded-[15px] mb-4 mt-4">
            <div className="flex items-center justify-start mt-2">
                <IonSkeletonText
                    animated
                    style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                />

                <IonSkeletonText
                    animated
                    style={{ width: '80px', height: '14px', marginLeft: '8px' }}
                />
            </div>

            <IonSkeletonText
                animated
                style={{ width: '60%', height: '18px', marginTop: '12px', marginLeft: '4px' }}
            />

            <div className="w-full mt-2 ml-2 mr-2 mb-4">
                <IonSkeletonText
                    animated
                    style={{ width: '90%', height: '14px', marginBottom: '6px' }}
                />
                <IonSkeletonText
                    animated
                    style={{ width: '80%', height: '14px', marginBottom: '6px' }}
                />
                <IonSkeletonText animated style={{ width: '70%', height: '14px' }} />
            </div>
        </div>
    );
};

export default AiInsightsLearningSnapshotsSkeletonLoader;
