import React from 'react';
import { IonLabel, IonSkeletonText, IonThumbnail } from '@ionic/react';

export const CheckListItemSkeleton: React.FC = () => {
    return (
        <div className="mt-4 pb-4 w-full flex items-center justify-between">
            <div className="flex items-center justify-start">
                <IonThumbnail slot="start">
                    <IonSkeletonText
                        animated
                        style={{ width: '55px', height: '55px', borderRadius: '8px' }}
                    />
                </IonThumbnail>

                <IonLabel className="ml-6">
                    <h2>
                        <IonSkeletonText animated style={{ width: '150px', height: '14px' }} />
                    </h2>
                    <p>
                        <IonSkeletonText animated style={{ width: '100px', height: '12px' }} />
                    </p>
                </IonLabel>
            </div>

            <div slot="end" className="mr-2">
                <IonSkeletonText
                    animated
                    style={{ width: '25px', height: '26px', borderRadius: '50%' }}
                />
            </div>
        </div>
    );
};

export default CheckListItemSkeleton;
