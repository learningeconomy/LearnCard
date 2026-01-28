import React from 'react';

import { IonSkeletonText } from '@ionic/react';

export const AiPathwaySessionsSkeletonLoader: React.FC = () => {
    return (
        <div className="flex flex-col items-start justify-between w-full ion-padding border-solid border-[1px] border-grayscale-100 bg-white shadow-bottom-2-4 p-[15px] rounded-[15px]">
            <>
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-full mb-6">
                        <div className="flex items-center justify-between w-full">
                            <IonSkeletonText
                                animated
                                style={{ width: '70%', height: '20px', borderRadius: '4px' }}
                            />

                            <IonSkeletonText
                                animated
                                style={{ width: '24px', height: '20px', borderRadius: '4px' }}
                            />
                        </div>

                        <div className="w-full mt-4 space-y-2">
                            <IonSkeletonText animated style={{ width: '100%', height: '14px' }} />
                            <IonSkeletonText animated style={{ width: '90%', height: '14px' }} />
                            <IonSkeletonText animated style={{ width: '80%', height: '14px' }} />
                        </div>

                        <div className="w-full overflow-x-auto whitespace-nowrap mt-4 flex space-x-2">
                            {[...Array(3)].map((_, i) => (
                                <div
                                    key={i}
                                    className="rounded-full"
                                    style={{
                                        minWidth: '80px',
                                        height: '24px',
                                        borderRadius: '9999px',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <IonSkeletonText
                                        animated
                                        style={{ width: '100%', height: '100%' }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </>
        </div>
    );
};

export default AiPathwaySessionsSkeletonLoader;
